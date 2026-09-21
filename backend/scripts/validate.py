"""Measure the detection pipeline against backend/samples/ground_truth.json.

Run from backend/:  python scripts/validate.py [--markdown] [--conf 0.4]

Uses the same model loader, preprocessing and thresholds as POST /detect, but
calls the model directly so no rows are written to the history database.

Ground truth is a per-image person count (no box labels), so the metrics are
count-based:
  accuracy        = sum(min(detected, truth)) / sum(truth)        labelled images
  false positives = sum(max(detected - truth, 0)) / all detections labelled images
Images with count=null are stress images: they only feed reliability, timing
and confidence.
"""
import argparse
import json
import sys
import time
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from routes.detect import CONFIDENCE_THRESHOLD, PERSON_CLASS_ID, get_model  # noqa: E402
from utils.preprocessing import preprocess_frame  # noqa: E402

SAMPLES = Path(__file__).resolve().parents[1] / "samples"

TARGETS = {
    "accuracy": 0.85,
    "false_positive_rate": 0.10,
    "avg_inference_s": 1.5,
    "avg_confidence": 0.7,
    "reliability": 1.0,
}


def run_image(model, path: Path, conf: float) -> dict:
    image = cv2.imdecode(np.fromfile(str(path), np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("could not decode image")
    image = preprocess_frame(image)
    start = time.perf_counter()
    result = model.predict(image, classes=[PERSON_CLASS_ID], conf=conf, verbose=False)[0]
    elapsed = time.perf_counter() - start
    return {"count": len(result.boxes), "confidences": [float(c) for c in result.boxes.conf], "seconds": elapsed}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--markdown", action="store_true", help="print README-ready tables")
    parser.add_argument("--conf", type=float, default=CONFIDENCE_THRESHOLD, help="detection threshold (default: the one /detect uses)")
    args = parser.parse_args()

    truth = json.loads((SAMPLES / "ground_truth.json").read_text())["images"]
    model = get_model()

    rows, failures = [], []
    for name, info in sorted(truth.items()):
        try:
            rows.append({"file": name, "truth": info["count"], **run_image(model, SAMPLES / name, args.conf)})
        except Exception as exc:  # reliability counts any crash
            failures.append((name, str(exc)))

    labelled = [r for r in rows if r["truth"] is not None]
    total_truth = sum(r["truth"] for r in labelled)
    correct = sum(min(r["count"], r["truth"]) for r in labelled)
    false_pos = sum(max(r["count"] - r["truth"], 0) for r in labelled)
    detections = sum(r["count"] for r in labelled)
    all_conf = [c for r in rows for c in r["confidences"]]
    labelled_conf = [c for r in labelled for c in r["confidences"]]

    metrics = {
        "accuracy": correct / total_truth if total_truth else 0.0,
        "false_positive_rate": false_pos / detections if detections else 0.0,
        "avg_inference_s": sum(r["seconds"] for r in rows) / len(rows) if rows else 0.0,
        "avg_confidence": sum(all_conf) / len(all_conf) if all_conf else 0.0,
        "reliability": len(rows) / len(truth),
    }
    passed = {
        "accuracy": metrics["accuracy"] >= TARGETS["accuracy"],
        "false_positive_rate": metrics["false_positive_rate"] <= TARGETS["false_positive_rate"],
        "avg_inference_s": metrics["avg_inference_s"] <= TARGETS["avg_inference_s"],
        "avg_confidence": metrics["avg_confidence"] >= TARGETS["avg_confidence"],
        "reliability": metrics["reliability"] >= TARGETS["reliability"],
    }

    print(f"threshold: {args.conf}")
    print(f"{'image':32} {'truth':>5} {'found':>5} {'avg conf':>8} {'ms':>6}")
    for r in rows:
        avg = sum(r["confidences"]) / len(r["confidences"]) if r["confidences"] else 0.0
        t = "-" if r["truth"] is None else r["truth"]
        print(f"{r['file']:32} {t!s:>5} {r['count']:>5} {avg:>8.2f} {r['seconds'] * 1000:>6.0f}")
    for name, err in failures:
        print(f"{name:32} FAILED: {err}")

    labelled_avg = sum(labelled_conf) / len(labelled_conf) if labelled_conf else 0.0
    print(f"\nAvg confidence, labelled images only: {labelled_avg:.2f} (headline figure below includes stress images)")
    print(f"Labelled images: {len(labelled)}, stress images: {len(rows) - len(labelled)}, "
          f"people to find: {total_truth}, correct: {correct}, false positives: {false_pos}, detections: {detections}, "
          f"detections incl. stress images: {len(all_conf)}")
    rows_out = [
        ("Detection accuracy", f"{metrics['accuracy']:.1%}", ">= 85%", passed["accuracy"]),
        ("False positives", f"{metrics['false_positive_rate']:.1%}", "<= 10%", passed["false_positive_rate"]),
        ("Avg inference time", f"{metrics['avg_inference_s'] * 1000:.0f} ms", "<= 1500 ms", passed["avg_inference_s"]),
        ("Avg confidence", f"{metrics['avg_confidence']:.3f}", ">= 0.700", passed["avg_confidence"]),
        ("Reliability", f"{metrics['reliability']:.0%}", "100%", passed["reliability"]),
    ]
    if args.markdown:
        print("\n| Metric | Measured | Target | Met |\n|---|---|---|---|")
        for m, v, t, ok in rows_out:
            print(f"| {m} | {v} | {t} | {'yes' if ok else 'no'} |")
    else:
        print()
        for m, v, t, ok in rows_out:
            print(f"{m:20} {v:>10}  (target {t})  {'PASS' if ok else 'FAIL'}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
