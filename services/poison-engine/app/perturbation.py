from __future__ import annotations

import hashlib
from io import BytesIO

import numpy as np
from PIL import Image, ImageFilter, UnidentifiedImageError

MAX_IMAGE_WIDTH = 4096
MAX_IMAGE_HEIGHT = 4096
MAX_IMAGE_PIXELS = MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT


class InvalidImageError(ValueError):
    """Raised when uploaded bytes cannot be safely decoded as an image."""


def perturb_image(source: bytes, intensity: float) -> bytes:
    """Apply deterministic bounded image transform for demo protected preview.

    Pipeline: Gaussian blur + per-channel bounded pixel offset.
    This is a demo transform — NOT benchmarked adversarial protection
    (not Glaze, not Nightshade). Effectiveness against real AI scrapers
    has not been measured. Label output as Experimental in all UI and docs.

    Args:
        source: Raw image bytes (PNG, JPEG, WebP).
        intensity: Strength 0.0 (none) to 1.0 (max blur + noise).

    Returns:
        Perturbed PNG image bytes.
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

    # 1) Heavy Watercolor Wash & Gaussian blur — merusak pola visual / scraping bot AI
    # Menghasilkan efek warna kabur/vignette seperti lukisan disiram air
    if intensity > 0:
        resolution_factor = min(image.width, image.height) / 22.0
        blur_radius = max(intensity * 14.0, resolution_factor * intensity)
        image = image.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    # 2) Bounded adversarial noise — ganggu CLIP/ViT embedding
    amplitude = round(intensity * 14)
    if amplitude:
        pixels = np.asarray(image, dtype=np.int16).copy()
        seed_hash = hashlib.sha256(source).digest()
        pixel_count = image.width * image.height
        seed_arr = np.frombuffer(seed_hash, dtype=np.uint8)
        direction = ((np.resize(seed_arr, pixel_count) & 1).astype(np.int16) * 2 - 1).reshape(
            image.height, image.width
        )
        pixels[:, :, 0] += direction * amplitude
        pixels[:, :, 1] -= direction * amplitude
        pixels[:, :, 2] += direction * max(1, amplitude // 2)
        image = Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))

    output = BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()
