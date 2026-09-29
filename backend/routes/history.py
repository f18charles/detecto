from datetime import datetime, timezone

from fastapi import APIRouter, Query

from models.record import DetectionRecord, HistoryEntry, SessionLocal

router = APIRouter()


def _to_naive_utc(value: datetime | None) -> datetime | None:
    # Timestamps are stored as naive UTC and SQLite drops any tz offset when
    # binding, so normalise aware inputs here. Naive inputs are taken as UTC.
    if value is not None and value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


@router.get("/history", response_model=list[HistoryEntry])
async def get_history(
    date_from: datetime | None = Query(None, description="Only records at or after this time"),
    date_to: datetime | None = Query(None, description="Only records at or before this time"),
    min_confidence: float | None = Query(None, ge=0.0, le=1.0),
    limit: int | None = Query(None, ge=1, le=1000),
) -> list[HistoryEntry]:
    date_from = _to_naive_utc(date_from)
    date_to = _to_naive_utc(date_to)
    with SessionLocal() as session:
        query = session.query(DetectionRecord)
        if date_from is not None:
            query = query.filter(DetectionRecord.timestamp >= date_from)
        if date_to is not None:
            query = query.filter(DetectionRecord.timestamp <= date_to)
        if min_confidence is not None:
            query = query.filter(DetectionRecord.average_confidence >= min_confidence)
        query = query.order_by(DetectionRecord.timestamp.desc())
        if limit is not None:
            query = query.limit(limit)
        return [HistoryEntry.model_validate(record) for record in query.all()]


@router.post("/reset")
async def reset_history() -> dict[str, str]:
    with SessionLocal() as session:
        session.query(DetectionRecord).delete()
        session.commit()
    return {"status": "cleared"}
