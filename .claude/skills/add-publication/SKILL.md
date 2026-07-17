---
name: add-publication
description: DEPRECATED — superseded by the kanan-publish skill. Use kanan-publish to ingest/publish a Kanan Labs article. This stub exists only so older references resolve.
---

# Add Publication (deprecated)

This skill described the **v1 authoring contract** (`category`, `abstract`),
which was retired by `content/publications/AUTHORING.md` **v2** (`type` +
`cluster` + `takeaways` + `sources` + `boundary`). Following the old steps
will produce articles that fail validation.

**Use the `kanan-publish` skill instead** (`.claude/skills/kanan-publish/SKILL.md`).
It covers file placement, the assets-vs-content image trap, validation against
AUTHORING.md v2, the build, what gets generated, and the commit convention.

Unchanged principles that still apply:

- Never commit, push, or deploy before the user approves the built preview.
- Never rewrite article prose during ingestion — mechanical normalization only.
- The generator (`node scripts/generate-publications.js`) exits non-zero on
  contract violations; relay its output, grouped by file, and stop.
