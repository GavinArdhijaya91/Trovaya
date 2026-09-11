from PIL import Image, ImageFilter
from pathlib import Path
import time

source_path = Path("apps/web/public/assets/flower-photo.jpg")
im = Image.open(source_path).convert("RGB")

t0 = time.perf_counter()
# Test resolution-aware watercolor blur
blur_radius = max(16.0, (min(im.width, im.height) / 24.0) * (0.8 / 0.8))
blurred = im.filter(ImageFilter.GaussianBlur(radius=blur_radius))
t1 = time.perf_counter()

out = Path("apps/web/public/assets/test-heavy-blur.png")
blurred.save(out)
print(f"Image {im.width}x{im.height}, blur_radius={blur_radius:.1f}, time={t1-t0:.4f}s")
