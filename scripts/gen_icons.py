"""Generate PWA icons (rounded gradient square + white check mark).

Pure standard library -- builds PNG files byte-by-byte with zlib.
Run from the project root:  python scripts/gen_icons.py
"""
import math
import os
import struct
import zlib


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(
        ">I", zlib.crc32(tag + data) & 0xFFFFFFFF
    )


def write_png(path, size, pixel_fn):
    rows = bytearray()
    for y in range(size):
        rows.append(0)  # filter type: none
        for x in range(size):
            rows += bytes(pixel_fn(x, y))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(bytes(rows), 9))
            + chunk(b"IEND", b"")
        )
    print("wrote", path)


def clamp(v):
    return 0.0 if v < 0 else (1.0 if v > 1 else v)


def seg_dist(px, py, x1, y1, x2, y2):
    """Distance from point to line segment (normalized coords)."""
    dx, dy = x2 - x1, y2 - y1
    l2 = dx * dx + dy * dy
    t = clamp(((px - x1) * dx + (py - y1) * dy) / l2)
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))


def make(size):
    feather = 1.5 / size  # ~1.5px anti-aliasing

    def rgba(x, y):
        nx, ny = (x + 0.5) / size, (y + 0.5) / size
        # rounded-square mask, corner radius 22%
        r = 0.22
        cx = min(max(nx, r), 1 - r)
        cy = min(max(ny, r), 1 - r)
        d_out = r - math.hypot(nx - cx, ny - cy)  # >0 inside the shape
        alpha = clamp(d_out / feather + 0.5)
        # flat brand background (single color, no gradient)
        bg = (37, 109, 81)  # deep green accent
        # white check mark: two stroke segments
        w = 0.075
        d = min(
            seg_dist(nx, ny, 0.28, 0.53, 0.44, 0.68),
            seg_dist(nx, ny, 0.44, 0.68, 0.73, 0.36),
        )
        cover = clamp((w / 2 - d) / feather + 0.5)
        px_out = tuple(
            int(bg[i] + (255 - bg[i]) * cover) for i in range(3)
        )
        return (*px_out, int(alpha * 255))

    return rgba


def main():
    os.makedirs("public", exist_ok=True)
    for s in (192, 512):
        write_png(f"public/pwa-{s}.png", s, make(s))


if __name__ == "__main__":
    main()
