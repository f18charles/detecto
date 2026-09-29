import logging
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from ultralytics import YOLO

from models.record import BoundingBox, DetectionRecord, DetectionResponse, SessionLocal
from utils.preprocessing import preprocess_frame

logger = logging.getLogger("detecto.detect")

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
PERSON_CLASS_ID = 0
CONFIDENCE_THRESHOLD = 0.4

_model: YOLO | None = None


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
async def detect(file: UploadFile = File(...)) -> DetectionResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG or PNG images are supported")

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

    with SessionLocal() as session:
        session.add(
            DetectionRecord(
                person_count=len(boxes),
                average_confidence=average_confidence,
                inference_time_ms=inference_time_ms,
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
