from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models.record import Base
from routes import detect, history

SAMPLES = Path(__file__).resolve().parents[1] / "samples"


@pytest.fixture(scope="session", autouse=True)
def loaded_model():
    # Load once for the whole run; each /detect test reuses it.
    return detect.get_model()


@pytest.fixture()
def session_factory(tmp_path, monkeypatch):
    """A fresh SQLite file per test, swapped in wherever the routes use SessionLocal."""
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(detect, "SessionLocal", factory)
    monkeypatch.setattr(history, "SessionLocal", factory)
    return factory


@pytest.fixture()
def client(session_factory):
    app = FastAPI()
    app.include_router(detect.router)
    app.include_router(history.router)
    return TestClient(app)


@pytest.fixture()
def sample_bytes():
    def read(name: str) -> bytes:
        return (SAMPLES / name).read_bytes()

    return read
