from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
for name in ("discover", "document", "recognise", "promote"):
    source = root / "assets" / f"work-{name}.png"
    if not source.exists():
        continue
    target = root / "app" / "public" / "images" / f"work-{name}.webp"
    with Image.open(source) as image:
        image.convert("RGB").save(target, "WEBP", quality=89, method=6)
    print(f"Saved {target.name} ({target.stat().st_size:,} bytes)")
