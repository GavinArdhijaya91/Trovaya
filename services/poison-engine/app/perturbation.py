from __future__ import annotations

import hashlib
from io import BytesIO

from PIL import Image, UnidentifiedImageError

MAX_IMAGE_PIXELS = 25_000_000


class InvalidImageError(ValueError):
    """Raised when uploaded bytes cannot be safely decoded as an image."""


def perturb_image(source: bytes, intensity: float) -> bytes:
    """Apply deterministic, bounded RGB perturbations as a Glaze/Nightshade simulation.

    This is intentionally not an implementation of either research system. It produces
    subtle pixel noise suitable for demonstrating the protocol pipeline.
    """
    if not 0.0 <= intensity <= 1.0:
        raise ValueError("intensity must be between 0 and 1")

    try:
        with Image.open(BytesIO(source)) as opened:
            opened.load()
            if opened.width * opened.height > MAX_IMAGE_PIXELS:
                raise InvalidImageError("image dimensions are too large")
            image = opened.convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("file must be a valid image") from exc

    amplitude = round(intensity * 12)
    if amplitude:
        pixels = image.load()
        seed = hashlib.sha256(source).digest()
        for y in range(image.height):
            for x in range(image.width):
                red, green, blue = pixels[x, y]
                direction = 1 if seed[(x + y * image.width) % len(seed)] & 1 else -1
                pixels[x, y] = (
                    _clamp(red + direction * amplitude),
                    _clamp(green - direction * amplitude),
                    _clamp(blue + direction * max(1, amplitude // 2)),
                )

    output = BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()


def _clamp(value: int) -> int:
    return max(0, min(255, value))
