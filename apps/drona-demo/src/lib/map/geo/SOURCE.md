# land-110m.json

Natural Earth 1:110m physical land polygons (`ne_110m_land`), public domain
(https://www.naturalearthdata.com/about/terms-of-use/).

Fetched once from `nvkelso/natural-earth-vector` — `geojson/ne_110m_land.geojson` — on
2026-09-18, then reduced: properties and bounding boxes dropped, coordinates rounded to
three decimals (~100 m, far below what 1:110m resolves). 127 features.

Vendored so the map renders offline — a demo that needs the venue's wifi to draw a
coastline is a demo that can fail on stage. Regenerate by re-running the same reduction
over a fresh download; nothing else reads the original file.
