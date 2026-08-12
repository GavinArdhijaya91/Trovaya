from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageDraw, ImageFont, UnidentifiedImageError

from .perturbation import InvalidImageError, MAX_IMAGE_PIXELS


def watermark_identity_document(source: bytes, label: str = "SAMPLE / CONTOH") -> bytes:
    """Render a prominent diagonal privacy watermark without persisting the source document."""
    try:
        with Image.open(BytesIO(source)) as opened:
            opened.load()
            if opened.width * opened.height > MAX_IMAGE_PIXELS:
                raise InvalidImageError("document dimensions are too large")
            image = opened.convert("RGBA")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("document must be a valid image") from exc

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font = ImageFont.load_default(size=max(18, min(image.size) // 12))
    box = draw.textbbox((0, 0), label, font=font)
    text_width = box[2] - box[0]
    text_height = box[3] - box[1]
    spacing = max(text_height * 4, 80)
    for y in range(-image.height, image.height * 2, spacing):
        for x in range(-image.width, image.width * 2, max(text_width + 80, 180)):
            draw.text((x, y), label, font=font, fill=(190, 25, 25, 105))

    watermarked = Image.alpha_composite(image, overlay).convert("RGB")
    output = BytesIO()
    watermarked.save(output, format="JPEG", quality=90, optimize=True)
    return output.getvalue()
