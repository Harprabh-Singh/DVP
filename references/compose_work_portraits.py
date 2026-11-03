from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

root = Path(__file__).resolve().parents[1]
out = root / "app" / "public" / "images"
size = (2048, 1152)


def compose(source: Path, target: Path, position: float) -> None:
    with Image.open(source) as original:
        original = original.convert("RGB")
        bg = Image.new("RGB", size)
        scale = max(size[0] / original.width, size[1] / original.height)
        resized = original.resize((round(original.width * scale), round(original.height * scale)), Image.Resampling.LANCZOS)
        left = (resized.width - size[0]) // 2
        top = (resized.height - size[1]) // 2
        bg.paste(resized, (-left, -top))
        bg = bg.filter(ImageFilter.GaussianBlur(34))
        bg = ImageEnhance.Brightness(bg).enhance(0.32)
        bg = ImageEnhance.Color(bg).enhance(0.65)

        shade = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(shade)
        for x in range(size[0]):
            alpha = round(235 * max(0, 1 - x / 1500))
            draw.line((x, 0, x, size[1]), fill=(24, 6, 10, alpha))
        bg = Image.alpha_composite(bg.convert("RGBA"), shade)

        portrait_height = 1280
        portrait_width = round(original.width * portrait_height / original.height)
        portrait = original.resize((portrait_width, portrait_height), Image.Resampling.LANCZOS)
        portrait = ImageEnhance.Color(portrait).enhance(0.88)
        x = round(size[0] * position)
        y = size[1] - portrait_height + 100
        bg.alpha_composite(portrait.convert("RGBA"), (x, y))
        bg.convert("RGB").save(target, "WEBP", quality=90, method=6)
    print(f"Saved {target.name} ({target.stat().st_size:,} bytes)")


compose(root / "assets" / "dvp-hero-mobile-full.png", out / "work-recognise.webp", 0.61)
compose(root / "references" / "proposal-media" / "image1.png", out / "work-promote.webp", 0.64)
