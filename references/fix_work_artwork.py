from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

root = Path(__file__).resolve().parents[1]
out = root / "app" / "public" / "images"
dancer_source = root / "references" / "proposal-media" / "image1.png"


def save_avif(image: Image.Image, name: str) -> None:
    target = out / name
    image.convert("RGB").save(target, "AVIF", quality=70, speed=6)
    print(f"Saved {target.name} ({target.stat().st_size:,} bytes)")


def blurred_background(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    scale = max(size[0] / source.width, size[1] / source.height)
    resized = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    background = resized.crop((left, top, left + size[0], top + size[1]))
    background = background.filter(ImageFilter.GaussianBlur(38))
    background = ImageEnhance.Brightness(background).enhance(0.36)
    return ImageEnhance.Color(background).enhance(0.68).convert("RGBA")


def feather_mask(size: tuple[int, int], left: int, right: int, top: int, bottom: int) -> Image.Image:
    mask = Image.new("L", size, 255)
    draw = ImageDraw.Draw(mask)
    for x in range(size[0]):
        alpha = 255
        if x < left:
            alpha = min(alpha, round(255 * x / left))
        if x >= size[0] - right:
            alpha = min(alpha, round(255 * (size[0] - x) / right))
        draw.line((x, 0, x, size[1]), fill=alpha)
    for y in range(size[1]):
        alpha = 255
        if y < top:
            alpha = min(alpha, round(255 * y / top))
        if y >= size[1] - bottom:
            alpha = min(alpha, round(255 * (size[1] - y) / bottom))
        if alpha < 255:
            draw.line((0, y, size[0], y), fill=alpha)
    return mask


with Image.open(root / "assets" / "dvp-hero.png") as image:
    save_avif(image, "work-recognise.avif")

with Image.open(dancer_source) as original:
    original = original.convert("RGB")
    desktop_size = (2048, 1152)
    desktop = blurred_background(original, desktop_size)
    portrait = original.resize((1067, 1600), Image.Resampling.LANCZOS).convert("RGBA")
    desktop.paste(portrait, (1040, -250), feather_mask(portrait.size, 320, 70, 60, 110))
    shade = Image.new("RGBA", desktop_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shade)
    for x in range(desktop_size[0]):
        alpha = round(150 * max(0, 1 - x / 1500))
        draw.line((x, 0, x, desktop_size[1]), fill=(24, 6, 10, alpha))
    desktop = Image.alpha_composite(desktop, shade)
    save_avif(desktop, "work-promote.avif")

    mobile_size = (1024, 1824)
    mobile = blurred_background(original, mobile_size)
    portrait = original.resize((1024, 1536), Image.Resampling.LANCZOS).convert("RGBA")
    mobile.paste(portrait, (0, -60), feather_mask(portrait.size, 30, 30, 90, 280))
    save_avif(mobile, "work-promote-mobile.avif")
