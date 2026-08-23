from __future__ import annotations

import hashlib
from io import BytesIO

import numpy as np
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_WIDTH = 4096
MAX_IMAGE_HEIGHT = 4096
MAX_IMAGE_PIXELS = MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT


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
            if (
                opened.width > MAX_IMAGE_WIDTH
                or opened.height > MAX_IMAGE_HEIGHT
                or opened.width * opened.height > MAX_IMAGE_PIXELS
            ):
                raise InvalidImageError("image dimensions are too large")
            image = opened.convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("file must be a valid image") from exc

    amplitude = round(intensity * 12)
    if amplitude:
        pixels = np.asarray(image, dtype=np.int16).copy()
        seed = np.frombuffer(hashlib.sha256(source).digest(), dtype=np.uint8)
        pixel_count = image.width * image.height
        direction = ((np.resize(seed, pixel_count) & 1).astype(np.int16) * 2 - 1).reshape(
            image.height, image.width
        )
        pixels[:, :, 0] += direction * amplitude
        pixels[:, :, 1] -= direction * amplitude
        pixels[:, :, 2] += direction * max(1, amplitude // 2)
        image = Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))

    output = BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()
