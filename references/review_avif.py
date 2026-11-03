from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
for name in ("work-recognise", "work-promote", "work-promote-mobile"):
    source = root / "app" / "public" / "images" / f"{name}.avif"
    target = root / "validation" / f"{name}-review.jpg"
    with Image.open(source) as image:
        review = image.convert("RGB")
        review.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        review.save(target, "JPEG", quality=88, optimize=True)
    print(target)
