# Research showcase content integrity

The September 6, 2026 report showed the new eight-month heading above the old
March weekly digest. At investigation time, both the source JSON and local
build JSON already contained the agreed corpus-wide content: $2.5B across 133
rounds, 1,949 signals, 160 policy moves, and 29 jurisdictions, with the four
Geography, Capital, Governance, and Sources insights.

The implementation allowed mixed versions: the heading/byline came from HTML,
while `js/strategic-insights.js` fetched an unversioned JSON file separately.
There was no check connecting that response to the HTML version. The old Git
checkpoint contains the exact weekly cards shown in the reported screenshot.
The available evidence cannot distinguish a cached JSON response from stale
build output at the time of the screenshot. The colour stylesheet itself does
not select or modify content. CSS and JavaScript also have one-year immutable
cache headers in `vercel.json`, requiring new URLs when their contents change.

The generator now embeds the JSON snapshot into `tracker.html` alongside its
matching heading/byline. The browser reads that snapshot without a second
content request. `data/strategic_insights.json` remains the editable source;
the embedded copy is generated, never independently edited. The generator
rejects the old weekly editorial card structure before it can partially update
the stats while preserving obsolete prose. Existing figure-drift warnings
continue to flag editorial numbers that need review as the corpus grows.

Run `npm run build` after changing content or styles and before previewing
`dist/`. For source-only preview, run `npm run build:research-stats` after content
edits. `node scripts/generate-research-stats.js --check` detects stale generated
HTML/data. Version changed CSS/JS URLs because of the hosting cache policy.

The byline uses the full 1,200px section width instead of a 600px cap. It remains
one line at the verified 1,440px desktop viewport and wraps naturally at 390px
without horizontal overflow. The new asset URLs are `shiny-text.css?v=2` and
`strategic-insights.js?v=2`.

Validation: 36 research-stat tests passed, including rejection of reverted weekly
cards, atomic heading/payload generation, JSON script escaping, and loading
without a network content request. The full site build and generated-content
check passed. Browser inspection confirmed all eight approved cards and the
retained light/red theme. Changes are local; no production deployment was made.
