"""Create responsive WebP photos and mobile walking frames. Requires Pillow.
Use --download-editorial to refresh originals cached in .qa (never shipped).
"""
from pathlib import Path
from PIL import Image
import argparse, json, re, urllib.request
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--download-editorial', action='store_true')
args = parser.parse_args()
originals = ROOT / '.qa/editorial-originals'
originals.mkdir(parents=True, exist_ok=True)
ids = sorted(set(re.findall(r'photo-\d+-[a-z0-9]+', (ROOT / 'src/data.ts').read_text(encoding='utf-8'))))
if args.download_editorial:
    for photo_id in ids:
        urllib.request.urlretrieve(f'https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=1600&q=85', originals / f'{photo_id}.jpg')
manifest = {}
original_bytes = optimized_bytes = 0
sources = [(originals / f'{p}.jpg', f'https://images.unsplash.com/{p}', 'editorial') for p in ids]
sources += [(p, f'/images/modest-fashion/{p.name}', 'modest-fashion') for p in sorted((ROOT / 'public/images/modest-fashion').glob('*.jpg'))]
for source, key, folder in sources:
    image = Image.open(source).convert('RGB')
    widths = sorted(set([min(480, image.width), min(900, image.width), min(1600, image.width)]))
    output = ROOT / 'public/images' / folder
    output.mkdir(parents=True, exist_ok=True)
    variants = []
    original_bytes += source.stat().st_size
    for width in widths:
        name = f'{source.stem}-{width}.webp'
        target = output / name
        image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS).save(target, 'WEBP', quality=80, method=6)
        variants.append({'src': f'/images/{folder}/{name}', 'width': width})
        if width == widths[min(1, len(widths)-1)]: optimized_bytes += target.stat().st_size
    manifest[key] = variants
(ROOT / 'src/lib/local-images.json').write_text(json.dumps(manifest, indent=2) + '\n')
mobile_dir = ROOT / 'public/animations/awm-walk/mobile'
before_mobile = sum(p.stat().st_size for p in mobile_dir.glob('*.webp'))
for source in sorted((ROOT / 'public/animations/awm-walk').glob('frame_*.webp')):
    image = Image.open(source).convert('RGBA')
    image.resize((round(image.width * 480 / image.height), 480), Image.Resampling.LANCZOS).save(mobile_dir / source.name, 'WEBP', quality=84, method=6, exact=True)
after_mobile = sum(p.stat().st_size for p in mobile_dir.glob('*.webp'))
report_path = ROOT / 'public/animations/awm-walk/manifest.json'
report = json.loads(report_path.read_text())
report['mobileBytes'] = after_mobile
report['mobileEncoding'] = 'WebP quality 84, 480px high, original alpha preserved'
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'photos': len(sources), 'originalPhotoBytes': original_bytes, 'default900WebpBytes': optimized_bytes,
                  'originalMobileFrameBytes': before_mobile, 'optimizedMobileFrameBytes': after_mobile}), flush=True)
