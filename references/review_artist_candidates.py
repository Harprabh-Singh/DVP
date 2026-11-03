from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1]
names = ['work-document', 'work-discover', 'dvp-hero-mobile-full', 'work-promote-mobile']
thumbs = []
for name in names:
    with Image.open(root / 'app' / 'public' / 'images' / f'{name}.avif') as source:
        image = source.convert('RGB')
        thumb = ImageOps.fit(image, (360, 450), Image.Resampling.LANCZOS, centering=(0.5, 0.42))
        thumbs.append((name, thumb))

sheet = Image.new('RGB', (760, 1000), '#17100f')
draw = ImageDraw.Draw(sheet)
for index, (name, image) in enumerate(thumbs):
    x = 10 + (index % 2) * 380
    y = 10 + (index // 2) * 495
    sheet.paste(image, (x, y))
    draw.text((x, y + 458), name, fill='#f2e8d5')

output = root / 'validation' / 'artist-candidates.jpg'
sheet.save(output, 'JPEG', quality=90)
print(output)
