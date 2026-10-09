"""Reproducible green-screen matting for the supplied AWM JPEG sequence.

Run with Python, Pillow and NumPy. Source numbering is sorted, not assumed
contiguous. All frames share a union crop and retain actual source movement.
The source has visible forearms; this key deliberately preserves them.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dataaa/Mannequin_walking_streetwear_outfit_20261010022633_frames"
OUT = ROOT / "public/animations/awm-walk"
files = sorted((p for p in SOURCE.glob("frame_*.jpg") if p.stem.split("_")[-1].isdigit()),
               key=lambda p: int(p.stem.split("_")[-1]))
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "mobile").mkdir(exist_ok=True)

def matte(path):
    rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    excess = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    alpha = 1 - np.clip((excess - 8) / 57, 0, 1)
    # Suppress key-colour spill without altering non-green fabric or shoe pixels.
    spill = np.maximum(excess - 3, 0)
    rgb[:, :, 1] -= spill
    rgba = np.dstack((rgb, alpha * 255)).clip(0, 255).astype(np.uint8)
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba)

bounds = [matte(p).getbbox() for p in files]
width, height = Image.open(files[0]).size
crop = (max(0, min(b[0] for b in bounds) - 12),
        max(0, min(b[1] for b in bounds) - 12),
        min(width, max(b[2] for b in bounds) + 12),
        min(height, max(b[3] for b in bounds) + 12))
samples = []
total = 0
for index, path in enumerate(files, 1):
    image = matte(path).crop(crop)
    target = OUT / f"frame_{index:04d}.webp"
    image.save(target, "WEBP", quality=88, method=4, exact=True)
    # Lossy YUV can introduce isolated green edge pixels. Fall back per-frame.
    decoded = np.asarray(Image.open(target)).astype(np.int16)
    green = decoded[:, :, 1] - np.maximum(decoded[:, :, 0], decoded[:, :, 2])
    if ((green > 12) & (decoded[:, :, 3] > 30)).any():
        image.save(target, "WEBP", lossless=True, quality=80, method=4, exact=True)
    mobile = image.resize((round(image.width * 480 / image.height), 480), Image.Resampling.LANCZOS)
    # Keep mobile edge colours exact: chroma subsampling is conspicuous at this scale.
    pixels = np.asarray(mobile).copy()
    pixels[:, :, 1] = np.minimum(pixels[:, :, 1], np.maximum(pixels[:, :, 0], pixels[:, :, 2]).astype(np.int16) + 3)
    mobile = Image.fromarray(pixels)
    mobile.save(OUT / "mobile" / target.name, "WEBP", lossless=True, quality=80, method=4, exact=True)
    total += target.stat().st_size
    if index in [1, 36, 72, 108, 144, len(files)]:
        samples.append(image)
    if index % 30 == 0:
        print(f"Processed {index}/{len(files)}", flush=True)

report = {"count": len(files), "crop": crop, "size": samples[0].size,
          "desktopBytes": total, "mobileBytes": sum(p.stat().st_size for p in (OUT / 'mobile').glob('*.webp')),
          "sourceIndices": [int(p.stem.split('_')[-1]) for p in files],
          "limitation": "Visible source forearms and hands preserved. No fabricated garment pixels."}
(OUT / "manifest.json").write_text(json.dumps(report, indent=2))
proof = Image.new("RGB", (6 * 220, 2 * 440), "#f7f3ed")
for index, image in enumerate(samples):
    image.thumbnail((210, 420), Image.Resampling.LANCZOS)
    for row, bg in enumerate(["#f7f3ed", "#181818"]):
        proof.paste(bg, (index * 220, row * 440, (index + 1) * 220, (row + 1) * 440))
        proof.paste(image, (index * 220 + (220-image.width)//2, row*440+10), image)
(ROOT / "docs").mkdir(exist_ok=True)
proof.save(ROOT / "docs/walk-alpha-proof.jpg", quality=93)
print(json.dumps(report), flush=True)
