import hashlib
from pathlib import Path
from app.perturbation import perturb_image

source_path = Path("apps/web/public/assets/flower-photo.jpg")
out_path = Path("apps/web/public/assets/flower-photo-poisoned.png")

source_bytes = source_path.read_bytes()
# Apply standard protocol 80% heavy watercolor wash
poisoned_bytes = perturb_image(source_bytes, intensity=0.80)
out_path.write_bytes(poisoned_bytes)

digest = hashlib.sha256(poisoned_bytes).hexdigest()
print(f"Generated {out_path} ({len(poisoned_bytes)} bytes)")
print(f"SHA-256: 0x{digest}")
