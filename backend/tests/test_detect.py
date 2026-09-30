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


def test_image_upload_defaults_media_type_and_saves_immediately(client, session_factory, sample_bytes):
    post_image(client, sample_bytes("small_group_columbia.jpg"), name="small_group_columbia.jpg")

    with session_factory() as session:
        rows = session.query(DetectionRecord).all()
    assert len(rows) == 1
    assert rows[0].media_type == "image"
    assert rows[0].media_name == "small_group_columbia.jpg"
    assert rows[0].frame_count is None


def post_video_frame(client, data, media_name, frame_index, total_frames, name="frame.jpg"):
    return client.post(
        "/detect",
        files={"file": (name, data, "image/jpeg")},
        data={
            "media_type": "video",
            "media_name": media_name,
            "frame_index": frame_index,
            "total_frames": total_frames,
        },
    )


def test_video_frames_only_save_one_history_row_at_the_end(client, session_factory, sample_bytes):
    # 1, 2 then 3 people across three frames of the same "video".
    frames = ["single_cyclist_unsplash.jpg", "pair_men_cold.jpg", "small_group_columbia.jpg"]

    for i, name in enumerate(frames):
        response = post_video_frame(client, sample_bytes(name), "clip.mp4", i, len(frames))
        assert response.status_code == 200
        with session_factory() as session:
            rows = session.query(DetectionRecord).all()
        if i < len(frames) - 1:
            assert len(rows) == 0
        else:
            assert len(rows) == 1
            row = rows[0]
            assert row.person_count == 3  # the max across the three frames
            assert row.media_type == "video"
            assert row.media_name == "clip.mp4"
            assert row.frame_count == 3
            assert 0.0 <= row.average_confidence <= 1.0


def test_video_requires_media_name_and_frame_info(client, sample_bytes):
    response = client.post(
        "/detect",
        files={"file": ("frame.jpg", sample_bytes("pair_men_cold.jpg"), "image/jpeg")},
        data={"media_type": "video"},
    )

    assert response.status_code == 400


def test_two_concurrent_videos_do_not_cross_contaminate(client, session_factory, sample_bytes):
    post_video_frame(client, sample_bytes("single_cyclist_unsplash.jpg"), "a.mp4", 0, 2)
    post_video_frame(client, sample_bytes("pair_men_cold.jpg"), "b.mp4", 0, 2)
    post_video_frame(client, sample_bytes("small_group_columbia.jpg"), "a.mp4", 1, 2)

    with session_factory() as session:
        rows = {row.media_name: row for row in session.query(DetectionRecord).all()}
    assert set(rows) == {"a.mp4"}
    assert rows["a.mp4"].person_count == 3
    assert rows["a.mp4"].frame_count == 2

    post_video_frame(client, sample_bytes("empty_street.jpg"), "b.mp4", 1, 2)

    with session_factory() as session:
        rows = {row.media_name: row for row in session.query(DetectionRecord).all()}
    assert set(rows) == {"a.mp4", "b.mp4"}
    assert rows["b.mp4"].person_count == 2
    assert rows["b.mp4"].frame_count == 2


def post_stream_frame(client, data, media_name, name="stream_frame.jpg"):
    return client.post(
        "/detect",
        files={"file": (name, data, "image/jpeg")},
        data={"media_type": "stream", "media_name": media_name},
    )


def test_stream_frames_save_nothing_until_finalized(client, session_factory, sample_bytes):
    frames = ["single_cyclist_unsplash.jpg", "pair_men_cold.jpg", "small_group_columbia.jpg"]

    for name in frames:
        response = post_stream_frame(client, sample_bytes(name), "cam-1")
        assert response.status_code == 200
        with session_factory() as session:
            assert session.query(DetectionRecord).count() == 0

    finalize = client.post("/detect/finalize", json={"media_name": "cam-1"})
    assert finalize.status_code == 200
    assert finalize.json() == {"status": "saved", "frame_count": 3}

    with session_factory() as session:
        rows = session.query(DetectionRecord).all()
    assert len(rows) == 1
    row = rows[0]
    assert row.person_count == 3  # the max across the three ticks
    assert row.media_type == "stream"
    assert row.media_name == "cam-1"
    assert row.frame_count == 3
    assert 0.0 <= row.average_confidence <= 1.0


def test_finalize_unknown_session_is_a_no_op(client, session_factory):
    response = client.post("/detect/finalize", json={"media_name": "never-started"})

    assert response.status_code == 200
    assert response.json() == {"status": "nothing to finalize"}
    with session_factory() as session:
        assert session.query(DetectionRecord).count() == 0


def test_stream_requires_media_name(client, sample_bytes):
    response = client.post(
        "/detect",
        files={"file": ("frame.jpg", sample_bytes("pair_men_cold.jpg"), "image/jpeg")},
        data={"media_type": "stream"},
    )

    assert response.status_code == 400


def test_two_concurrent_streams_do_not_cross_contaminate(client, session_factory, sample_bytes):
    post_stream_frame(client, sample_bytes("single_cyclist_unsplash.jpg"), "cam-a")
    post_stream_frame(client, sample_bytes("pair_men_cold.jpg"), "cam-b")
    post_stream_frame(client, sample_bytes("small_group_columbia.jpg"), "cam-a")

    client.post("/detect/finalize", json={"media_name": "cam-a"})
    client.post("/detect/finalize", json={"media_name": "cam-b"})

    with session_factory() as session:
        rows = {row.media_name: row for row in session.query(DetectionRecord).all()}
    assert rows["cam-a"].person_count == 3
    assert rows["cam-a"].frame_count == 2
    assert rows["cam-b"].person_count == 2
    assert rows["cam-b"].frame_count == 1

