---
name: kanan-publish
description: Publish a Kanan Labs article end to end — place the markdown and cover image correctly, validate against the AUTHORING.md v2.1 contract, build the static page + catalog + hub + sitemap + llms.txt, verify, and prepare the commit. Use when handed a publication markdown file, or when the user says "publish this article/publication". Supersedes the v1 add-publication flow.
---

# Kanan Publish

Publish one article to kananlabs.in. You need zero prior context — everything
is below. The pipeline is:

**place files → validate → build → verify → commit (after user approval)**

The contract is `content/publications/AUTHORING.md` (v2.1). **Read it before
judging any validation failure — it is the single source of truth.** The
validator (`scripts/publications/validate.js`, invoked by
`scripts/generate-publications.js`) implements its §9 literally and fails the
build on any violation.

## 1. Where files go (v2.1 nested layout)

| Artefact | Path | Rule |
|---|---|---|
| Article | `content/publications/<type>/<slug>/<slug>.md` | `<type>` is one of the five `type` enum values (§2.1 of AUTHORING.md); filename MUST equal the frontmatter `slug`, kebab-case; the containing folder MUST also be named `<slug>` |
| Cover/figure images (optional) | `content/publications/<type>/<slug>/assets/<file>.png` | Co-located with the article, in its own `assets/` subfolder; frontmatter `image: "assets/cover.png"` (path relative to the article's own folder, not repo root) |

Files prefixed `_` (e.g. `_TEMPLATE.md`) and `AUTHORING.md` are ignored by the
generator. `_TEMPLATE.md` (`content/publications/_TEMPLATE.md`) is a valid
worked example of the full nested layout — copy its structure when starting a
new article from scratch.

## 2. Image resolution (co-located assets — the old "image trap" is closed)

Each article's own `assets/` subfolder is copied straight into that article's
`dist/publications/<slug>/assets/` output directory during build
(`fs.cpSync`, wired in `scripts/generate-publications.js`). The frontmatter
`image` path is validated *and* resolved relative to the article's own folder
(`articleDir`), not the repo root. So as long as the image lives under the
same `<type>/<slug>/assets/` folder as the article and `image:` points at it
with a relative path (e.g. `assets/cover.png`), validation passing means it
will actually be present in production — no silent 404 trap.

**Do not** place images anywhere under `content/publications/` other than the
article's own `assets/` subfolder — anywhere else is unresolvable by the
generator regardless of what the `image` frontmatter path claims.

## 3. Validate

```bash
node scripts/generate-publications.js
```

- Exit 0 → valid (warnings ⚠️ are advisory — report them, they don't block).
- Exit 1 → one or more violations. Every error across every file is printed,
  grouped by file, with `L<n>` frontmatter/body line numbers.

## 4. Build

```bash
npm run build:publications   # generator + sitemap (fast path, use this)
# npm run build              # full site build — only if non-publication files changed
```

## 5. What gets generated (verify each)

| Output | Path |
|---|---|
| Article page | `dist/publications/<slug>/index.html` |
| Catalog (all cards + tab filters) | `dist/resources.html` — generated from the manifest + `data/resources-extra.json`. Never hand-edit `resources.html` at the repo root: it is the template, its data block is injected at build time. |
| Cluster hub | `dist/publications/cluster/<cluster>/index.html` |
| Manifest | `content/publications/index.json` **and** `dist/publications/index.json` |
| Sitemap | `dist/sitemap.xml` (article + hub URLs) |
| Answer-engine index | `dist/llms.txt` (grouped by cluster, takeaway summaries) |

Spot-check the article page raw HTML: the takeaways block sits directly below
the masthead; "Last reviewed:" is visible; the Sources section is a plain
numbered list — linked title, authority, and retrieved date only, no anchor
text shown (the anchor is still required in frontmatter for internal
citability grading, it just isn't rendered); the boundary statement(s) appear
verbatim at the foot; JSON-LD parses and carries `abstract` + `citation`
(+ `FAQPage` if `faq` given).

## 6. Commit

Stop and show the user the built page before committing. After approval:

```
feat(publications): add "<title>"
```

Include: `content/publications/<type>/<slug>/<slug>.md`,
`content/publications/<type>/<slug>/assets/` (if any images), and
`content/publications/index.json` (the manifest — only regenerates when
**every** article in the repo passes validation; see the note below).
**Do NOT commit `dist/`** — it is untracked build output (`.gitignore`);
Vercel runs `npm run build` on every push and generates all pages
server-side. Pushing the markdown is what publishes. CI
(`.github/workflows/publications.yml`) re-validates on the PR;
a malformed article cannot merge.

## 6.1 ⚠️ One bad article blocks the whole site's regeneration

`generatePublications()` validates every article in the repo, and if **any**
file has a blocking error, it exits before writing the catalog
(`dist/resources.html`), the cluster hubs, `llms.txt`, or either manifest
(`content/publications/index.json` and `dist/publications/index.json`).
Individual `dist/publications/<slug>/index.html` pages for the
already-passing articles still get written (that happens per-file before the
exit check), but the site-wide surfaces do not update at all.

**Practical effect when publishing a batch:** if you're adding several
articles in one session and even one of them fails validation, none of the
others will show up on the catalog page or cluster hubs, get into the
manifest, or get indexed in `llms.txt` — even though every valid article in
the batch individually builds a correct page. Always get a **fully clean
`npm run build:publications`** (zero blocking errors across the entire repo,
not just the article you're touching) before treating any article in a batch
as done.

## 7. Reading a validation failure

Each error names the file, the line, and the AUTHORING.md section. Fix by class:

| Error mentions | Fix |
|---|---|
| `retired in AUTHORING.md v2` (`category`, `abstract`) | Reclassify with `type` (§2.1) + `cluster` (§2.2); move the abstract's job into `takeaways.summary` |
| `Description is N chars` | Rewrite to 150–160 chars — a complete answer, not a teaser |
| `takeaways.summary is N words` | Rewrite to 40–60 words, standalone |
| `no named entity, date, number or citable procedure` | Add the specific: a code (SB005), a date, a figure, a document + clause |
| `anchor … restates the document title` | Point at the clause: `para 3(b)`, `Sl. 42`, `Section 16(3)(a)` — never the document name |
| `boundary must include "X"` | Add the value to `boundary: []` — the rendered statement is regulatory protection, not decoration (§8.2) |
| `Banned phrase (§8.1)` | Reword. The lexicon is ratified; there are no exceptions |
| `Entity name "X" … canonical form is "Y"` | Use the canonical register spelling exactly |
| `First person … founder-brief` | Institutional types never say I/we/our. Rewrite, or reclassify as `founder-brief` only if it genuinely is one |
| `must open with a standalone paragraph` | Every `##` opens with its Verdict paragraph (§7.1) — conclusion first, quotable alone |
| `not nested under` | Fix the heading ladder: `#` chapter → `##` section → `###` note |

## 8. What this skill must NEVER do

- **Never publish an article that fails validation.** No exceptions, no
  "temporary" bypasses.
- **Never invent an `anchor`.** If the clause reference is unknown, the author
  must open the primary source and find it. A guessed anchor is worse than a
  missing one.
- **Never edit `AUTHORING.md` to make a failing article pass.** If an article
  fails, fix the article, not the contract. If you believe the contract itself
  is wrong, stop and tell the user — the contract is a founder decision.
- Never reword the §8.2 boundary statements — they render verbatim from
  `scripts/publications/contract.js`.
- Never invent article prose on the author's behalf — mechanical normalization
  only (filename↔slug, date format, whitespace, list syntax).
