import cv2
import numpy as np


def preprocess_frame(image: np.ndarray) -> np.ndarray:
    """Apply contrast adjustment before inference.

    Resizing/normalization for the model itself is handled internally by
    ultralytics (letterbox resize + scaling) in routes/detect.py, so this
    only does the piece that's safe to apply on the original-resolution
    image without disturbing the coordinate space returned to the caller.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    lab = cv2.merge((l_channel, a_channel, b_channel))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
