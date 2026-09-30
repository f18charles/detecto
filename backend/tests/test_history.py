from datetime import datetime, timedelta, timezone

import pytest

from models.record import DetectionRecord

NOW = datetime(2026, 9, 21, 12, 0, 0)  # naive UTC, as stored


@pytest.fixture()
def seeded(session_factory):
    """Three rows: 2h, 1h and 0h before NOW, with confidence 0.5, 0.75, 0.9."""
    with session_factory() as session:
        for hours_ago, confidence, count in [(2, 0.5, 1), (1, 0.75, 2), (0, 0.9, 3)]:
            session.add(
                DetectionRecord(
                    timestamp=NOW - timedelta(hours=hours_ago),
                    person_count=count,
                    average_confidence=confidence,
                    inference_time_ms=100.0,
                )
            )
        session.commit()


def counts(response):
    return [row["person_count"] for row in response.json()]


def test_empty_history(client):
    response = client.get("/history")

    assert response.status_code == 200
    assert response.json() == []


def test_returns_all_rows_newest_first(client, seeded):
    response = client.get("/history")

    assert response.status_code == 200
    assert counts(response) == [3, 2, 1]
    assert set(response.json()[0]) == {
        "id",
        "timestamp",
        "person_count",
        "average_confidence",
        "inference_time_ms",
        "media_type",
        "media_name",
        "frame_count",
    }


def test_min_confidence_filter(client, seeded):
    assert counts(client.get("/history", params={"min_confidence": 0.7})) == [3, 2]


def test_min_confidence_is_inclusive(client, seeded):
    assert counts(client.get("/history", params={"min_confidence": 0.75})) == [3, 2]


def test_date_from_filter(client, seeded):
    params = {"date_from": (NOW - timedelta(minutes=90)).isoformat()}

    assert counts(client.get("/history", params=params)) == [3, 2]


def test_date_to_filter(client, seeded):
    params = {"date_to": (NOW - timedelta(minutes=90)).isoformat()}

    assert counts(client.get("/history", params=params)) == [1]


def test_date_range_and_confidence_combine(client, seeded):
    params = {
        "date_from": (NOW - timedelta(minutes=90)).isoformat(),
        "min_confidence": 0.8,
    }

    assert counts(client.get("/history", params=params)) == [3]


def test_limit_keeps_the_newest_rows(client, seeded):
    assert counts(client.get("/history", params={"limit": 2})) == [3, 2]


def test_utc_offset_is_converted_not_ignored(client, seeded):
    # 13:30+03:00 is 10:30 UTC, i.e. 90 minutes before NOW, same as the naive case above.
    cutoff = datetime(2026, 9, 21, 13, 30, tzinfo=timezone(timedelta(hours=3))).isoformat()

    assert counts(client.get("/history", params={"date_from": cutoff})) == [3, 2]


def test_z_suffix_matches_naive_utc(client, seeded):
    aware = client.get("/history", params={"date_from": "2026-09-21T10:30:00Z"})
    naive = client.get("/history", params={"date_from": "2026-09-21T10:30:00"})

    assert counts(aware) == counts(naive) == [3, 2]


@pytest.mark.parametrize(
    "params",
    [
        {"min_confidence": 1.5},
        {"min_confidence": -0.1},
        {"limit": 0},
        {"limit": 1001},
        {"date_from": "not-a-date"},
    ],
)
def test_invalid_filters_return_422(client, params):
    assert client.get("/history", params=params).status_code == 422


def test_reset_clears_history(client, seeded):
    response = client.post("/reset")

    assert response.status_code == 200
    assert response.json() == {"status": "cleared"}
    assert client.get("/history").json() == []


def test_reset_on_empty_history_is_fine(client):
    assert client.post("/reset").status_code == 200
