import asyncio
import time
from io import BytesIO

import pytest
from PIL import Image

from app.perturbation import InvalidImageError, perturb_image
from app.rate_limit import RateLimitMiddleware


def png_bytes(width: int, height: int) -> bytes:
    output = BytesIO()
    Image.new("RGB", (width, height), (100, 120, 140)).save(output, "PNG")
    return output.getvalue()


def test_transform_is_deterministic_and_bounded() -> None:
    source = png_bytes(64, 64)
    first = perturb_image(source, 1.0)
    second = perturb_image(source, 1.0)
    assert first == second
    with Image.open(BytesIO(first)) as result:
        assert result.getextrema() == ((88, 112), (108, 132), (134, 146))


def test_1024_square_completes_within_demo_budget() -> None:
    source = png_bytes(1024, 1024)
    started = time.perf_counter()
    perturb_image(source, 0.35)
    assert time.perf_counter() - started < 5.0


def test_rejects_dimensions_above_supported_limit() -> None:
    with pytest.raises(InvalidImageError, match="dimensions are too large"):
        perturb_image(png_bytes(4097, 1), 0.35)


def test_limiter_serializes_state_without_blocking_thread_lock() -> None:
    limiter = RateLimitMiddleware(object(), requests_per_minute=10)

    async def exercise() -> list[bool]:
        return await asyncio.gather(*(limiter.allow("demo", now=1.0) for _ in range(20)))

    results = asyncio.run(exercise())
    assert results.count(True) == 10
    assert results.count(False) == 10
