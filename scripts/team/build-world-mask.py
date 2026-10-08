#!/usr/bin/env python3
"""Rasterise a land mask for the Team page hero (js/team-hero-waves.js).

Source: Natural Earth 110m land (public domain) via the world-atlas TopoJSON
package (ISC). Output: a grayscale equirectangular PNG centred on 75°E so
India and the Asia-Europe corridor sit mid-frame. White = land, black = sea,
slightly blurred so the shader can smoothstep the coastline.

The shader reads this projection's bounds from MAP_BOUNDS in
js/team-hero-waves.js; keep LON_MIN/LON_MAX/LAT_MIN/LAT_MAX in sync with it.

Usage:
    python3 scripts/team/build-world-mask.py [path/to/land-110m.json]
"""
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SOURCE_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json"
OUTPUT = Path(__file__).resolve().parents[2] / "added-assets" / "team" / "world-mask.png"

LON_MIN, LON_MAX = -105.0, 255.0  # 360° window centred on 75°E
LAT_MIN, LAT_MAX = -60.0, 80.0    # drop Antarctica and the polar cap
WIDTH = 2048
HEIGHT = round(WIDTH * (LAT_MAX - LAT_MIN) / (LON_MAX - LON_MIN))
SUPERSAMPLE = 2
BLUR_RADIUS = 1.2


def load_topology(argv):
    if len(argv) > 1:
        return json.loads(Path(argv[1]).read_text())
    with urllib.request.urlopen(SOURCE_URL, timeout=30) as response:
        return json.loads(response.read())


def decode_arcs(topology):
    """Undo TopoJSON delta encoding and the quantisation transform."""
    (sx, sy), (tx, ty) = topology["transform"]["scale"], topology["transform"]["translate"]
    decoded = []
    for arc in topology["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * sx + tx, y * sy + ty))
        decoded.append(points)
    return decoded


def ring_points(ring, arcs):
    points = []
    for index in ring:
        arc = arcs[index] if index >= 0 else list(reversed(arcs[~index]))
        points.extend(arc if not points else arc[1:])
    return points


def unwrap(points):
    """Keep consecutive longitudes within 180° so offsets draw whole rings."""
    out = [points[0]]
    for lon, lat in points[1:]:
        prev = out[-1][0]
        while lon - prev > 180:
            lon -= 360
        while prev - lon > 180:
            lon += 360
        out.append((lon, lat))
    return out


def project(points, offset, width, height):
    return [
        ((lon + offset - LON_MIN) / (LON_MAX - LON_MIN) * width,
         (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * height)
        for lon, lat in points
    ]


def polygons(topology):
    for geometry in topology["objects"]["land"]["geometries"]:
        if geometry["type"] == "Polygon":
            yield geometry["arcs"]
        elif geometry["type"] == "MultiPolygon":
            yield from geometry["arcs"]


def render(topology):
    arcs = decode_arcs(topology)
    width, height = WIDTH * SUPERSAMPLE, HEIGHT * SUPERSAMPLE
    image = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(image)
    for polygon in polygons(topology):
        rings = [unwrap(ring_points(ring, arcs)) for ring in polygon]
        for offset in (-360, 0, 360):
            outer, holes = rings[0], rings[1:]
            if len(outer) >= 3:
                draw.polygon(project(outer, offset, width, height), fill=255)
            for hole in holes:
                if len(hole) >= 3:
                    draw.polygon(project(hole, offset, width, height), fill=0)
    image = image.resize((WIDTH, HEIGHT), Image.LANCZOS)
    return image.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))


def main(argv):
    try:
        topology = load_topology(argv)
    except (OSError, ValueError) as error:
        sys.exit(f"Could not load land TopoJSON: {error}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    render(topology).save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main(sys.argv)
