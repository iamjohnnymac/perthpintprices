"""Downscales public/icon-master.png (written by generate-brand-assets.mjs)
into the PWA/iOS icon sizes and assembles favicon.ico. Run via the .mjs
script, not directly."""
from pathlib import Path

from PIL import Image

PUB = Path(__file__).resolve().parent.parent / "public"

master = Image.open(PUB / "icon-master.png").convert("RGBA")

for name, size in [("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180)]:
    master.resize((size, size), Image.LANCZOS).save(PUB / name)
    print(f"written {PUB / name}")

master.save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print(f"written {PUB / 'favicon.ico'}")

(PUB / "icon-master.png").unlink()
