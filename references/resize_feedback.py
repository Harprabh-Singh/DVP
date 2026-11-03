from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "validation"
for index in (3, 4):
    source = root / f"work-feedback-{index}.png"
    target = root / f"work-feedback-{index}-review.jpg"
    with Image.open(source) as image:
        image = image.convert("RGB")
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(target, "JPEG", quality=86, optimize=True)
    print(f"Saved {target.name} ({target.stat().st_size:,} bytes)")
