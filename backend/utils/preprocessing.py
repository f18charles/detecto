import numpy as np


def preprocess_frame(image: np.ndarray, target_size: tuple[int, int] = (640, 640)) -> np.ndarray:
    """Resize/normalize a frame before inference.

    TODO(backend): replace with real resizing, normalization, and contrast
    adjustment once a detection model is wired into routes/detect.py.
    """
    return image
