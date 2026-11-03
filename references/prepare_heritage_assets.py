from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1]
images = root / 'app' / 'public' / 'images'
assets = {
    'heritage-music.avif': ('artist-vocalist.avif', (0.48, 0.36)),
    'heritage-instruments.avif': ('work-document.avif', (0.57, 0.48)),
    'heritage-dance.avif': ('work-promote.avif', (0.66, 0.5)),
    'heritage-oral-traditions.avif': ('work-discover.avif', (0.57, 0.5)),
}
reviews = []
for filename, (source_name, centering) in assets.items():
    with Image.open(images / source_name) as source:
        image = ImageOps.fit(source.convert('RGB'), (1024, 1152), Image.Resampling.LANCZOS, centering=centering)
        target = images / filename
        image.save(target, 'AVIF', quality=79, speed=6)
        reviews.append((filename, image.resize((256, 288), Image.Resampling.LANCZOS)))
        print(f'{filename}: {target.stat().st_size:,} bytes')

sheet = Image.new('RGB', (1080, 326), '#e9dfcf')
draw = ImageDraw.Draw(sheet)
for index, (name, image) in enumerate(reviews):
    x = 10 + index * 268
    sheet.paste(image, (x, 10))
    draw.text((x, 303), name, fill='#2a1115')
review = root / 'validation' / 'heritage-assets.jpg'
sheet.save(review, 'JPEG', quality=90)
print(review)
