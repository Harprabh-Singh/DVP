from pathlib import Path
from PIL import Image

images = Path(__file__).resolve().parents[1] / "app" / "public" / "images"
converted = []

for source in sorted(images.glob("*.webp")):
    target = source.with_suffix(".avif")
    with Image.open(source) as image:
        image.convert("RGB").save(target, "AVIF", quality=68, speed=6)
    converted.append((source, target))
    print(f"Converted {source.name} -> {target.name} ({target.stat().st_size:,} bytes)")

for source, target in converted:
    if target.exists() and target.stat().st_size > 0:
        source.unlink()

print(f"Converted {len(converted)} images; removed superseded WebP files")
