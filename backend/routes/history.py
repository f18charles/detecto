from fastapi import APIRouter

from models.record import DetectionRecord, HistoryEntry, SessionLocal

router = APIRouter()


@router.get("/history", response_model=list[HistoryEntry])
async def get_history() -> list[HistoryEntry]:
    with SessionLocal() as session:
        records = session.query(DetectionRecord).order_by(DetectionRecord.timestamp.desc()).all()
        return [HistoryEntry.model_validate(record) for record in records]


@router.post("/reset")
async def reset_history() -> dict[str, str]:
    with SessionLocal() as session:
        session.query(DetectionRecord).delete()
        session.commit()
    return {"status": "cleared"}
