"""Remuestrea la nubosidad equirectangular a Mercator y baja el blanco plano."""
from pathlib import Path

import numpy as np
from PIL import Image

source = Path(r"g:\Proyectos\dataint\public\planet\clouds.webp")
image = Image.open(source)
pixels = np.asarray(image).astype(np.float32)
height, width = pixels.shape[:2]
alpha = pixels[:, :, 3]

rows = (np.arange(height) + 0.5) / height
latitude = np.degrees(np.arctan(np.sinh(np.pi * (1.0 - 2.0 * rows))))
source_row = np.clip((90.0 - latitude) / 180.0 * (height - 1), 0, height - 1)
low = np.floor(source_row).astype(np.int32)
high = np.clip(low + 1, 0, height - 1)
blend = (source_row - low).astype(np.float32)[:, None]
mercator = alpha[low] * (1.0 - blend) + alpha[high] * blend

# La textura ya venía con tope ~167. La curva baja el velo fino y deja los núcleos.
tone = np.clip(mercator / 167.0, 0.0, 1.0)
tone = np.power(tone, 1.65) * 148.0

pole = np.clip((np.abs(latitude) - 68.0) / 12.0, 0.0, 1.0)
fade = 1.0 - (pole * pole * (3.0 - 2.0 * pole))
tone *= fade[:, None]
tone[np.abs(latitude) >= 80.0] = 0.0

alpha_out = np.clip(np.rint(tone), 0, 255).astype(np.uint8)
rgb = np.zeros((height, width, 3), np.uint8)
rgb[:, :] = (198, 206, 214)
output = np.dstack((rgb, alpha_out))
target = Image.fromarray(output, "RGBA")
target.save(source, format="WEBP", lossless=True, method=6)
print(
    "wrote",
    source,
    source.stat().st_size,
    "alpha mean",
    float(alpha_out.mean()),
    "max",
    int(alpha_out.max()),
    "top",
    int(alpha_out[:40].max()),
    "bottom",
    int(alpha_out[-40:].max()),
    "equator",
    float(alpha_out[height // 2 - 20 : height // 2 + 20].mean()),
)
