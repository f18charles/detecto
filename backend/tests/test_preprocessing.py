import numpy as np

from utils.preprocessing import preprocess_frame


def test_keeps_shape_and_dtype():
    image = np.random.default_rng(0).integers(0, 255, (120, 200, 3), dtype=np.uint8)

    result = preprocess_frame(image)

    assert result.shape == image.shape
    assert result.dtype == np.uint8


def test_does_not_modify_the_input():
    image = np.random.default_rng(1).integers(0, 255, (64, 64, 3), dtype=np.uint8)
    before = image.copy()

    preprocess_frame(image)

    assert np.array_equal(image, before)


def test_raises_contrast_on_a_flat_dark_image():
    rng = np.random.default_rng(2)
    image = (rng.integers(20, 40, (128, 128, 3))).astype(np.uint8)

    result = preprocess_frame(image)

    assert result.std() > image.std()
