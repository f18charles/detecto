import pytest

from models.record import DetectionRecord


def post_image(client, data, content_type="image/jpeg", name="frame.jpg"):
    return client.post("/detect", files={"file": (name, data, content_type)})


def test_counts_people_in_a_clear_photo(client, sample_bytes):
    response = post_image(client, sample_bytes("small_group_columbia.jpg"))

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 3
    assert len(body["boxes"]) == 3


def test_response_shape_and_values(client, sample_bytes):
    body = post_image(client, sample_bytes("pair_men_cold.jpg")).json()

    assert set(body) == {"count", "boxes", "average_confidence", "inference_time_ms", "processed_image"}
    assert body["processed_image"] is None
    assert body["inference_time_ms"] > 0
    for box in body["boxes"]:
        assert set(box) == {"x", "y", "width", "height", "confidence"}
        assert box["width"] > 0 and box["height"] > 0
        assert 0.4 <= box["confidence"] <= 1.0
    confidences = [b["confidence"] for b in body["boxes"]]
    assert body["average_confidence"] == pytest.approx(sum(confidences) / len(confidences))


def test_boxes_are_in_original_image_pixels(client, sample_bytes):
    # small_group_columbia.jpg is 1280x818; boxes must stay inside that frame.
    body = post_image(client, sample_bytes("small_group_columbia.jpg")).json()

    for box in body["boxes"]:
        assert box["x"] >= 0 and box["y"] >= 0
        assert box["x"] + box["width"] <= 1280 + 1
        assert box["y"] + box["height"] <= 818 + 1


def test_scene_without_people_returns_zero(client, sample_bytes):
    body = post_image(client, sample_bytes("empty_street.jpg")).json()

    assert body["count"] == 0
    assert body["boxes"] == []
    assert body["average_confidence"] == 0.0


def test_accepts_png(client, sample_bytes):
    import cv2
    import numpy as np

    image = cv2.imdecode(np.frombuffer(sample_bytes("pair_men_cold.jpg"), np.uint8), cv2.IMREAD_COLOR)
    ok, png = cv2.imencode(".png", image)
    assert ok

    response = post_image(client, png.tobytes(), content_type="image/png", name="frame.png")

    assert response.status_code == 200
    assert response.json()["count"] == 2


def test_rejects_unsupported_content_type(client, sample_bytes):
    response = post_image(client, sample_bytes("pair_men_cold.jpg"), content_type="image/gif")

    assert response.status_code == 400


def test_rejects_empty_file(client):
    response = post_image(client, b"")

    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_rejects_corrupt_bytes_labelled_as_jpeg(client):
    response = post_image(client, b"this is not an image at all")

    assert response.status_code == 400
    assert "not a valid image" in response.json()["detail"]


def test_rejects_request_without_file_field(client):
    response = client.post("/detect")

    assert response.status_code == 422


def test_detection_is_saved_to_history(client, session_factory, sample_bytes):
    body = post_image(client, sample_bytes("small_group_columbia.jpg")).json()

    with session_factory() as session:
        rows = session.query(DetectionRecord).all()
    assert len(rows) == 1
    assert rows[0].person_count == body["count"]
    assert rows[0].average_confidence == pytest.approx(body["average_confidence"])


def test_rejected_upload_is_not_saved(client, session_factory):
    post_image(client, b"garbage")

    with session_factory() as session:
        assert session.query(DetectionRecord).count() == 0

