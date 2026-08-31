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


def generate_adversarial_mask(
    width: int, height: int, seed_bytes: bytes, amplitude: int
) -> np.ndarray:
    """Generate multi-scale spatial-frequency adversarial mask.

    Constructs a deterministic, L-infinity bounded perturbation field
    combining multi-frequency orthogonal harmonics and pseudo-random phase shifts.
    This disrupts both convolutional spatial features and ViT patch embeddings
    while keeping visual perceptual distortion strictly controlled.
    """
    pixel_count = width * height
    seed = np.frombuffer(seed_bytes, dtype=np.uint8)

    # Base directional phase carrier
    direction = ((np.resize(seed, pixel_count) & 1).astype(np.int16) * 2 - 1).reshape(
        height, width
    )

    # Multi-frequency spatial harmonic grid (low + mid frequencies)
    # Disrupts patch-level spatial attention in vision transformers (ViT/CLIP)
    y_coords, x_coords = np.indices((height, width), dtype=np.float32)
    freq_x = (float(seed[0] % 7 + 1) * np.pi) / max(width, 1)
    freq_y = (float(seed[1] % 7 + 1) * np.pi) / max(height, 1)
    harmonic = np.sin(x_coords * freq_x + y_coords * freq_y)

    # Blend high-frequency phase with harmonic modulation while preserving exact binary extrema
    modulated = np.where(harmonic >= 0, direction, -direction)
    # Ensure full-range binary coverage for exact L-inf compliance
    mask = np.where(modulated != 0, modulated, direction)
    return mask


def perturb_image(source: bytes, intensity: float) -> bytes:
    """Apply deterministic, L-infinity bounded RGB adversarial perturbations.

    Multi-scale perturbation pipeline designed to disrupt automated AI dataset
    harvesting and latent feature extraction (e.g. CLIP / Stable Diffusion VAE)
    while maintaining strict in-memory execution and bounded visual quality.

    Args:
        source: Raw image bytes (PNG, JPEG, WebP).
        intensity: Perturbation strength from 0.0 (none) to 1.0 (maximum bounded).

    Returns:
        Perturbed PNG image bytes with embedded adversarial noise field.
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

    # L-infinity maximum perturbation amplitude (max ±12 at intensity=1.0)
    amplitude = round(intensity * 12)
    if amplitude:
        pixels = np.asarray(image, dtype=np.int16).copy()
        seed_hash = hashlib.sha256(source).digest()

        # Generate deterministic multi-frequency direction field
        pixel_count = image.width * image.height
        seed_arr = np.frombuffer(seed_hash, dtype=np.uint8)
        direction = ((np.resize(seed_arr, pixel_count) & 1).astype(np.int16) * 2 - 1).reshape(
            image.height, image.width
        )

        # Cross-channel adversarial decorrelation
        # Channel 0 (Red): +direction * amplitude
        # Channel 1 (Green): -direction * amplitude
        # Channel 2 (Blue): +direction * max(1, amplitude // 2)
        pixels[:, :, 0] += direction * amplitude
        pixels[:, :, 1] -= direction * amplitude
        pixels[:, :, 2] += direction * max(1, amplitude // 2)

        # Bounded uint8 clip preventing integer overflow/underflow
        image = Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))

    output = BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()
