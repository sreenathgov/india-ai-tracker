---
name: add-publication
description: Ingest a markdown article into the Kanan Labs publications platform — validate it against the authoring contract, build the static SEO/AEO page, verify crawler visibility, and serve a local preview for approval. Use when the user submits a new publication/blog/article markdown file, or says "add this publication/article".
---

# Add Publication

Ingest one markdown article into the publications platform. The pipeline is:
**validate → place → build → verify → preview → STOP for user approval.**
Never commit, push, or deploy before the user explicitly approves the preview.

The authoring contract is `content/publications/AUTHORING.md` — read it first; it is
the single source of truth for frontmatter and structure rules. This skill never
rewrites article prose; only mechanical normalization is allowed.

## Step 1 — Validate

Read the submitted `.md` file and check against the contract:

- Frontmatter: `title`, `slug`, `description`, `abstract`, `author`, `date`,
  `category` present and non-empty; dates ISO `YYYY-MM-DD`; `category` in the
  controlled list; `tags` a list; `image` (if given) exists in the repo.
- `slug` is kebab-case, equals the filename, and is unique (check
  `content/publications/index.json` and existing files).
- Structure: no content before the first `#`; at least one `#` chapter; every `##`
  under a `#`, every `###` under a `##`; each `##` opens with a standalone
  paragraph (the card teaser); no raw HTML.

**Mechanical fixes you may apply silently:** filename↔slug casing, date formatting,
trailing whitespace, tag list syntax.
**Anything substantive** (missing description, bad structure, category not in list):
report ALL violations to the user in one list with suggested fixes, and stop.
Do not invent content on the author's behalf.

## Step 2 — Place

Copy the validated file to `content/publications/<slug>.md`.

## Step 3 — Build

```bash
npm run build:publications   # generator + sitemap only (fast path)
# or: npm run build          # full site build, use when other site files changed
```

Confirm: `dist/publications/<slug>/index.html` exists; `content/publications/index.json`
gained the entry; `dist/sitemap.xml` contains `/publications/<slug>/`; `dist/llms.txt`
lists the article. The generator exits non-zero on contract violations — if it fails,
report its output and stop.

## Step 4 — Verify (programmatic, crawler's-eye view)

Serve `dist/` locally (e.g. `python3 -m http.server 8091 --directory dist`) and check
the RAW HTML (curl, no JS) of `/publications/<slug>/`:

1. **All three layers present** — grep for a distinctive phrase from (a) a chapter
   overview paragraph, (b) a `##` section body paragraph beyond the teaser, and
   (c) a `###` note. All three MUST appear in the raw response.
2. **Heading hierarchy** — exactly one `<h1>`; chapters `<h2>`; sections `<h3>`;
   notes `<h4>`.
3. **JSON-LD** — extract the `application/ld+json` block, parse it, confirm
   `Article.headline`, `datePublished`, `author.name`, `description` match the
   frontmatter.
4. **Meta** — canonical is `https://kananlabs.in/publications/<slug>/`; title tag,
   description, `og:*`/`twitter:*` populated.
5. Then open the page in the browser: masthead renders; cards open the Analysis
   panel; notes open the In-Depth panel; connector dots align; no console errors;
   no runtime fetch of the `.md` (page is hydrated from the DOM).

## Step 5 — Present for approval, then stop

Report to the user: slug, title, word count, reading time, the local preview URL,
and the verification results. **Stop here.** Only after the user approves:
commit the new/changed files (`content/publications/<slug>.md`,
`content/publications/index.json`) with message
`feat(publications): add "<title>"` — and push only if the user asks.

## Failure notes

- Generator validation output already names the file and violation — relay it.
- If the preview reveals visual problems, do not tweak the reader CSS/JS as part
  of ingestion; report instead (template bugs are platform work, not article work).
