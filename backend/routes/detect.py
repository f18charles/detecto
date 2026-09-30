import logging
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from ultralytics import YOLO

from models.record import BoundingBox, DetectionRecord, DetectionResponse, SessionLocal
from utils.preprocessing import preprocess_frame

logger = logging.getLogger("detecto.detect")

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
PERSON_CLASS_ID = 0
CONFIDENCE_THRESHOLD = 0.4

_model: YOLO | None = None

# Accumulates per-frame results for an in-progress video, keyed by media_name.
# Single-process, in-memory, no TTL: a video that never sends its last frame
# (e.g. the user cancels mid-upload) leaks its entry for the life of the process.
_video_buffers: dict[str, dict] = {}


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO("yolov8n.pt")
        # First predict() call triggers a one-time internal warmup (torch/torchvision
        # op registration + a dummy forward pass) — do it now, at load time, so it
        # doesn't get billed to whichever request happens to arrive first.
        _model.predict(np.zeros((640, 640, 3), dtype=np.uint8), verbose=False)
    return _model


@router.post("/detect", response_model=DetectionResponse)
async def detect(
    file: UploadFile = File(...),
    media_type: str = Form("image"),
    media_name: str | None = Form(None),
    frame_index: int | None = Form(None),
    total_frames: int | None = Form(None),
) -> DetectionResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG or PNG images are supported")

    if media_type == "video" and (media_name is None or frame_index is None or total_frames is None):
        raise HTTPException(
            status_code=400,
            detail="Video frames require media_name, frame_index and total_frames",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")

    image = preprocess_frame(image)

    start = time.perf_counter()
    results = get_model().predict(
        image,
        classes=[PERSON_CLASS_ID],
        conf=CONFIDENCE_THRESHOLD,
        verbose=False,
    )
    inference_time_ms = (time.perf_counter() - start) * 1000

    boxes = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        boxes.append(
            BoundingBox(
                x=x1,
                y=y1,
                width=x2 - x1,
                height=y2 - y1,
                confidence=float(box.conf[0]),
            )
        )

    average_confidence = sum(b.confidence for b in boxes) / len(boxes) if boxes else 0.0
    logger.info(
        "count=%d avg_confidence=%.3f inference_time_ms=%.1f",
        len(boxes),
        average_confidence,
        inference_time_ms,
    )

    if media_type == "video":
        buffer = _video_buffers.setdefault(
            media_name,
            {"frames_seen": 0, "max_count": 0, "confidence_sum": 0.0, "confidence_n": 0, "inference_time_sum": 0.0},
        )
        buffer["frames_seen"] += 1
        buffer["max_count"] = max(buffer["max_count"], len(boxes))
        buffer["confidence_sum"] += sum(b.confidence for b in boxes)
        buffer["confidence_n"] += len(boxes)
        buffer["inference_time_sum"] += inference_time_ms

        if frame_index == total_frames - 1:
            compiled_confidence = (
                buffer["confidence_sum"] / buffer["confidence_n"] if buffer["confidence_n"] else 0.0
            )
            with SessionLocal() as session:
                session.add(
                    DetectionRecord(
                        person_count=buffer["max_count"],
                        average_confidence=compiled_confidence,
                        inference_time_ms=buffer["inference_time_sum"] / buffer["frames_seen"],
                        media_type="video",
                        media_name=media_name,
                        frame_count=buffer["frames_seen"],
                    )
                )
                session.commit()
            del _video_buffers[media_name]
    else:
        with SessionLocal() as session:
            session.add(
                DetectionRecord(
                    person_count=len(boxes),
                    average_confidence=average_confidence,
                    inference_time_ms=inference_time_ms,
                    media_type="image",
                    media_name=media_name or file.filename,
                )
            )
            session.commit()

    return DetectionResponse(
        count=len(boxes),
        boxes=boxes,
        average_confidence=average_confidence,
        inference_time_ms=inference_time_ms,
        processed_image=None,
    )
