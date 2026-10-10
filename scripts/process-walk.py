"""Export every supplied frame with a garment-safe transparent matte.

Install scripts/frame-requirements.txt first. U2-Net runs only during asset
preparation; no model, Python runtime or segmentation work ships to the browser.
The official model is cached in the ignored .qa directory and checksum-verified.
"""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import argparse
import hashlib
import json
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
TEMP_PACKAGES = ROOT / ".qa/python-packages"
if TEMP_PACKAGES.exists():
    sys.path.insert(0, str(TEMP_PACKAGES))
import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw

SOURCES = [
    ("transformation", "Mannequin_outfit_transforming_wh__20261010150210_frames"),
    ("walking", "Ghost_mannequin_walking_color_tr__20261010152817_frames"),
]
ASSET_ROOT = "/animations/awm-outfit-sequence-clean"
MATTE_REVISION = 3
OUT = ROOT / "public" / ASSET_ROOT.lstrip("/")
MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"
MODEL_MD5 = "60024c5c889badc19c04ad937298a77b"
INPUT_CROP = (438, 35, 831, 720)
OUTPUT_CROP = (458, 45, 811, 720)
session = None


def initialize(model):
    global session
    cv2.setNumThreads(1)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 3
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model), options, providers=["CPUExecutionProvider"])


def clean_edges(rgb, alpha):
    """Regularize the silhouette and produce a soft, decontaminated matte."""
    rgb = rgb.copy()
    r, g, b = rgb.astype(float).transpose(2, 0, 1)
    # Close single-pixel notches, then smooth the contour as a continuous field.
    # No screen-color pixel deletions or repeated erosion: those tear corners.
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    coverage = cv2.GaussianBlur(alpha.astype(np.float32) / 255, (0, 0), 1.05)
    coverage = np.clip((coverage - .20) / .65, 0, 1)
    coverage = coverage * coverage * (3 - 2 * coverage)
    silhouette = (coverage >= .5).astype(np.uint8) * 255
    distance = cv2.distanceTransform(silhouette, cv2.DIST_L2, 5)
    screen = (r / (g + 1) < .55) & (b / (g + 1) < .80) & (g > 65)
    core = ((distance >= 4) & ~screen).astype(np.uint8)
    # Smooth interpolation of clean interior colors avoids the blocky nearest-
    # pixel border from revision 2. The fallback handles narrow fingers/gaps.
    _, nearest = cv2.distanceTransformWithLabels(1 - core, cv2.DIST_L2, 5,
                                                 labelType=cv2.DIST_LABEL_PIXEL)
    colors = np.zeros((int(nearest.max()) + 1, 3), dtype=np.uint8)
    colors[nearest[core > 0]] = rgb[core > 0]
    weight = cv2.GaussianBlur(core.astype(np.float32), (0, 0), 2)
    weighted_color = cv2.GaussianBlur(rgb.astype(np.float32) * core[:, :, None], (0, 0), 2)
    clean = weighted_color / np.maximum(weight[:, :, None], 1e-6)
    clean[weight < 1e-4] = colors[nearest[weight < 1e-4]]
    blend = np.clip((4 - distance) / 2, 0, 1)[:, :, None]
    rgb = np.clip(rgb * (1 - blend) + clean * blend, 0, 255).astype(np.uint8)
    # RGB-only despill for stronger reflections on trousers and footwear.
    lower = np.clip((np.arange(rgb.shape[0])[:, None] / rgb.shape[0] - .44) / .04, 0, 1)
    r, g, b = rgb.astype(float).transpose(2, 0, 1)
    neutral = np.maximum(r, b)
    spill = (np.clip((g / (neutral + 1) - 1.10) / .20, 0, 1)
             * np.clip((g / (r + 1) - 1.22) / .30, 0, 1) * lower)
    rgb[:, :, 1] = (g - spill * np.maximum(g - neutral - 5, 0)).astype(np.uint8)
    alpha = np.rint(coverage * 255).astype(np.uint8)
    rgba = np.dstack((rgb, alpha))
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba)


def matte(path):
    original = Image.open(path).convert("RGB")
    if original.size != (1280, 720):
        raise ValueError(f"Unexpected source dimensions: {path}")
    image = original.crop(INPUT_CROP)
    rgb = np.asarray(image).copy()
    # Semantic foreground seeds preserve green-lit fabric, unlike a chroma key.
    tensor = np.asarray(image.resize((320, 320), Image.Resampling.LANCZOS), dtype=np.float32)
    tensor = (tensor / max(tensor.max(), 1) - [.485, .456, .406]) / [.229, .224, .225]
    prediction = session.run(None, {session.get_inputs()[0].name:
        tensor.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
    prediction = (prediction - prediction.min()) / max(float(np.ptp(prediction)), 1e-6)
    probability = cv2.resize(prediction, image.size, interpolation=cv2.INTER_LINEAR)
    trimap = np.where(probability > .5, cv2.GC_PR_FGD, cv2.GC_PR_BGD).astype(np.uint8)
    trimap[probability > .92] = cv2.GC_FGD
    trimap[probability < .02] = cv2.GC_BGD
    # Refine uncertain boundaries against the original full-resolution pixels.
    cv2.setRNGSeed(17)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), trimap, None,
                np.zeros((1, 65)), np.zeros((1, 65)), 2, cv2.GC_INIT_WITH_MASK)
    alpha = np.isin(trimap, [cv2.GC_FGD, cv2.GC_PR_FGD]).astype(np.uint8) * 255
    _, labels, stats, _ = cv2.connectedComponentsWithStats(alpha, 8)
    kept = np.flatnonzero(stats[:, cv2.CC_STAT_AREA] >= 96)
    alpha = np.isin(labels, kept[kept != 0]).astype(np.uint8) * 255
    # Retain original segmentation for inspecting future edge refinements.
    mask_cache = ROOT / ".qa/matte-masks" / path.parent.name
    mask_cache.mkdir(parents=True, exist_ok=True)
    Image.fromarray(alpha).save(mask_cache / f"{path.stem}.png")
    x, y = INPUT_CROP[:2]
    return clean_edges(rgb, alpha).crop((OUTPUT_CROP[0] - x, OUTPUT_CROP[1] - y,
                                     OUTPUT_CROP[2] - x, OUTPUT_CROP[3] - y))


def encode(item):
    index, path = item
    image = matte(path)
    target = OUT / f"frame_{index:04d}.webp"
    image.save(target, "WEBP", quality=92, method=4, exact=True)
    mobile = image.resize((round(image.width * 480 / image.height), 480), Image.Resampling.LANCZOS)
    mobile_target = OUT / "mobile" / target.name
    mobile.save(mobile_target, "WEBP", quality=88, method=4, exact=True)
    return {"frame": index, "desktopBytes": target.stat().st_size,
            "mobileBytes": mobile_target.stat().st_size,
            "foregroundPixels": int(np.count_nonzero(np.asarray(image)[:, :, 3] > 127))}


def make_proof(indices, target, thumb=(145, 290)):
    width, height = thumb[0] + 5, thumb[1] + 30
    proof = Image.new("RGB", (width * len(indices), height * 2), "#f7f3ed")
    draw = ImageDraw.Draw(proof)
    for column, index in enumerate(indices):
        image = Image.open(OUT / f"frame_{index:04d}.webp")
        image.thumbnail(thumb, Image.Resampling.LANCZOS)
        for row, color in enumerate(["#f7f3ed", "#181818"]):
            top = row * height
            proof.paste(color, (column * width, top, (column + 1) * width, top + height))
            proof.paste(image, (column * width + (width - image.width) // 2, top + 4), image)
            draw.text((column * width + 10, top + height - 20), f"Frame {index}", fill="#b96c37")
    proof.save(target, quality=95)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=ROOT / ".qa/u2net.onnx")
    parser.add_argument("--workers", type=int, default=2)
    args = parser.parse_args()
    if not args.model.exists():
        args.model.parent.mkdir(parents=True, exist_ok=True)
        print("Downloading the official U2-Net model for local processing", flush=True)
        urllib.request.urlretrieve(MODEL_URL, args.model)
    with args.model.open("rb") as model:
        if hashlib.file_digest(model, "md5").hexdigest() != MODEL_MD5:
            raise ValueError("Model checksum mismatch; replace the cached download")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "mobile").mkdir(exist_ok=True)
    files, segments = [], []
    for name, folder in SOURCES:
        frames = sorted((ROOT / "dataaa" / folder).glob("frame_*.jpg"),
                        key=lambda path: int(path.stem.split("_")[-1]))
        if not frames:
            raise FileNotFoundError(f"No source frames in {folder}")
        start = len(files) + 1
        files.extend(frames)
        segments.append({"name": name, "folder": folder, "start": start,
                         "end": len(files), "count": len(frames),
                         "sourceIndices": [int(path.stem.split("_")[-1]) for path in frames]})
    count, boundary = len(files), segments[0]["end"]
    critical = sorted({1, round(boundary / 2), boundary, boundary + 1,
                       round((boundary + 1 + count) / 2), count - 1, count})
    # Every source frame is retained at both resolutions; there is no sampling.
    config = {"assetRoot": ASSET_ROOT, "revision": MATTE_REVISION, "count": count, "criticalFrames": critical,
              "mobileFrames": list(range(1, count + 1)), "segments": segments}
    results = []
    with ProcessPoolExecutor(max_workers=max(1, args.workers), initializer=initialize,
                             initargs=(args.model,)) as pool:
        for completed, result in enumerate(pool.map(encode, enumerate(files, 1)), 1):
            results.append(result)
            if completed % 30 == 0 or completed == count:
                print(f"Processed {completed}/{count} desktop and mobile frames", flush=True)
    report = {**config, "crop": list(OUTPUT_CROP), "size": [353, 675],
              "desktopBytes": sum(item["desktopBytes"] for item in results),
              "mobileBytes": sum(item["mobileBytes"] for item in results),
              "encoding": "Desktop WebP quality 92; mobile 480px high WebP quality 88; smooth alpha",
              "matting": "U2-Net seeds, GrabCut, continuous smoothed alpha, interpolated clean edge colors, RGB-only green despill",
              "modelSource": MODEL_URL, "modelMD5": MODEL_MD5,
              "limitation": "Original source forearms/hands are preserved. The clip boundary is a direct cut."}
    (OUT / "manifest.json").write_text(json.dumps(report, indent=2) + "\n")
    (ROOT / "src/lib/walk-sequence.json").write_text(json.dumps(config, indent=2) + "\n")
    (ROOT / ".qa/sequence-matte-metrics.json").write_text(json.dumps(results, indent=2) + "\n")
    make_proof([1, 35, 59, 88, 117, 150, 175, 176, 215, 255, 285, 315, count],
               ROOT / "docs/outfit-sequence-alpha-proof.jpg")
    print(json.dumps({"count": count, "boundary": boundary,
                      "desktopBytes": report["desktopBytes"], "mobileBytes": report["mobileBytes"]}), flush=True)


if __name__ == "__main__":
    main()
