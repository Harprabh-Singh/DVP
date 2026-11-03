from pathlib import Path

import numpy as np
from contourpy import contour_generator
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'references' / 'dvp-logo-source.jpeg'
OUTPUT = ROOT / 'app' / 'public' / 'images' / 'dvp-logo.svg'
SIZE = 600
SCALE = 2


def simplify(points: np.ndarray, tolerance: float) -> np.ndarray:
    """Ramer–Douglas–Peucker simplification for cleaner vector outlines."""
    if len(points) <= 2:
        return points
    start = points[0]
    end = points[-1]
    segment = end - start
    length = np.linalg.norm(segment)
    if length == 0:
        distances = np.linalg.norm(points - start, axis=1)
    else:
        distances = np.abs(np.cross(segment, points - start) / length)
    index = int(np.argmax(distances))
    if distances[index] <= tolerance:
        return np.array([start, end])
    left = simplify(points[: index + 1], tolerance)
    right = simplify(points[index:], tolerance)
    return np.vstack((left[:-1], right))


def vector_paths(mask: np.ndarray, minimum_area: float, tolerance: float) -> str:
    height, width = mask.shape
    generator = contour_generator(
        x=np.arange(width),
        y=np.arange(height),
        z=mask.astype(np.float32),
        name='serial',
    )
    paths = []
    factor = SIZE / width
    for contour in generator.lines(0.5):
        if len(contour) < 4:
            continue
        if np.linalg.norm(contour[0] - contour[-1]) > 1.5:
            contour = np.vstack((contour, contour[0]))
        area = 0.5 * abs(np.dot(contour[:, 0], np.roll(contour[:, 1], -1)) - np.dot(contour[:, 1], np.roll(contour[:, 0], -1)))
        if area < minimum_area:
            continue
        contour = simplify(contour, tolerance) * factor
        if len(contour) < 3:
            continue
        commands = [f'M{contour[0, 0]:.2f} {contour[0, 1]:.2f}']
        commands.extend(f'L{x:.2f} {y:.2f}' for x, y in contour[1:])
        commands.append('Z')
        paths.append(''.join(commands))
    return ''.join(paths)


source = Image.open(SOURCE).convert('RGB')
# Crop precisely to the circular badge, removing the black presentation canvas.
badge = source.crop((264, 398, 816, 950)).resize((552 * SCALE, 552 * SCALE), Image.Resampling.LANCZOS)
rgb = np.asarray(badge).astype(np.float32)
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
luminance = r * 0.2126 + g * 0.7152 + b * 0.0722
chroma = rgb.max(axis=2) - rgb.min(axis=2)

orange = (r > 125) & (r - g > 45) & (g - b > 25) & (b < 105)
y, x = np.mgrid[: rgb.shape[0], : rgb.shape[1]]
dune_region = (y > 490) & (y < 595) & (x > 160) & (x < 930)
ivory = (luminance > 145) & (chroma < 55) & ~orange & ~(dune_region & (luminance < 190))

ivory_data = vector_paths(ivory, minimum_area=1.4, tolerance=0.72)
orange_data = vector_paths(orange, minimum_area=4, tolerance=0.65)

# Redraw the simple dunes as smooth curves rather than retaining JPEG artefacts.
dune_data = (
    'M105 304C142.5 281 166.5 272 194 276C226.5 280 250.5 298 292.5 305'
    'C251 302 219 288 190.5 287C158 284 134 295 105 304Z'
    'M318 307C348 300 368 285 396 281C425 278 448.5 296 484.5 303'
    'C448.5 299 426 290 399 290C368 291 349.5 305 318 307Z'
)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" role="img" aria-labelledby="title description">
  <title id="title">Desert Voice Project</title>
  <desc id="description">A Rajasthani folk musician with a traditional instrument, an orange desert sun and flowing dunes above the Desert Voice Project wordmark.</desc>
  <defs>
    <radialGradient id="badge" cx="44%" cy="36%" r="70%">
      <stop offset="0" stop-color="#292929"/>
      <stop offset="0.7" stop-color="#202020"/>
      <stop offset="1" stop-color="#171717"/>
    </radialGradient>
    <clipPath id="circle"><circle cx="300" cy="300" r="300"/></clipPath>
  </defs>
  <circle cx="300" cy="300" r="300" fill="url(#badge)"/>
  <g clip-path="url(#circle)">
    <path fill="#92928d" fill-rule="evenodd" d="{dune_data}"/>
    <path fill="#f0f0e9" fill-rule="evenodd" d="{ivory_data}"/>
    <path fill="#df8209" fill-rule="evenodd" d="{orange_data}"/>
  </g>
</svg>
'''
OUTPUT.write_text(svg, encoding='utf-8')
print(f'Created {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)')
print(f'Ivory paths: {ivory_data.count("M")}; orange paths: {orange_data.count("M")}; dune paths: {dune_data.count("M")}')
