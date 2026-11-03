from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "assets" / "dvp-hero-mobile-full.png"
target = root / "app" / "public" / "images" / "dvp-hero-mobile-full.webp"

with Image.open(source) as image:
    image.convert("RGB").save(target, "WEBP", quality=90, method=6)

print(f"Saved {target} ({target.stat().st_size:,} bytes)")
