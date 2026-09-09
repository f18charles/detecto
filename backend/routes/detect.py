import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from models.record import BoundingBox, DetectionRecord, DetectionResponse, SessionLocal

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}


@router.post("/detect", response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)) -> DetectionResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG or PNG images are supported")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    start = time.perf_counter()
    # TODO(backend): replace this mocked response with real inference
    # (see utils/preprocessing.py + a pretrained person-detection model).
    boxes = [
        BoundingBox(x=120, y=80, width=140, height=260, confidence=0.91),
        BoundingBox(x=310, y=95, width=130, height=250, confidence=0.87),
    ]
    inference_time_ms = (time.perf_counter() - start) * 1000
    average_confidence = sum(b.confidence for b in boxes) / len(boxes)

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
