from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1]
output_dir = root / 'app' / 'public' / 'images'
assets = {
    'artist-vocalist.avif': (root / 'references' / 'artist-generation' / 'manganiyar-voice.png', (0.5, 0.5)),
    'artist-instrumentalist.avif': (output_dir / 'work-document.avif', (0.57, 0.5)),
    'artist-dancer.avif': (output_dir / 'work-promote-mobile.avif', (0.5, 0.43)),
    'artist-percussionist.avif': (root / 'references' / 'artist-generation' / 'folk-percussionist.png', (0.5, 0.5)),
}

reviews = []
for filename, (source, centering) in assets.items():
    with Image.open(source) as image:
        portrait = ImageOps.fit(image.convert('RGB'), (1024, 1280), Image.Resampling.LANCZOS, centering=centering)
        target = output_dir / filename
        portrait.save(target, 'AVIF', quality=80, speed=6)
        reviews.append((filename, portrait.resize((320, 400), Image.Resampling.LANCZOS)))
        print(f'{filename}: {target.stat().st_size:,} bytes')

sheet = Image.new('RGB', (1320, 440), '#17100f')
draw = ImageDraw.Draw(sheet)
for index, (name, image) in enumerate(reviews):
    x = 10 + index * 328
    sheet.paste(image, (x, 10))
    draw.text((x, 416), name, fill='#f2e8d5')
review_path = root / 'validation' / 'artist-final-assets.jpg'
sheet.save(review_path, 'JPEG', quality=90)
print(review_path)
