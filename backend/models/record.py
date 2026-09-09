from datetime import datetime, timezone

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./detections.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DetectionRecord(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    person_count = Column(Integer, nullable=False)
    average_confidence = Column(Float, nullable=False)
    inference_time_ms = Column(Float, nullable=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float


class DetectionResponse(BaseModel):
    count: int
    boxes: list[BoundingBox]
    average_confidence: float
    inference_time_ms: float
    processed_image: str | None = None


class HistoryEntry(BaseModel):
    id: int
    timestamp: datetime
    person_count: int
    average_confidence: float
    inference_time_ms: float

    class Config:
        from_attributes = True
