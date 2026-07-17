/**
 * validate.js — the AUTHORING.md §9 validator.
 *
 * Implements every blocking check in the v2 contract, plus the advisory warns.
 * Errors and warnings carry a 1-based file line number where determinable
 * (null when not), so an author can jump straight to the offence.
 *
 * Contract: content/publications/AUTHORING.md. Enums/registers: ./contract.js.
 */

const fs = require('fs');
const path = require('path');
const {
    TYPES, SOURCES_REQUIRED_TYPES, CLUSTERS, AUTHORITIES,
    BOUNDARY_BY_CLUSTER, BANNED_LEXICON, ENTITY_REGISTER, FIRST_PERSON_PATTERNS
} = require('./contract');

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function isValidIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim() !== '';
}

// Markdown inline syntax → plain text (for word counts and heuristics)
function stripInlineMarkdown(text) {
    return String(text)
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // [text](url) → text
        .replace(/[*_`]/g, '');
}

// Neutralize URLs so lexicon/entity/person scans don't fire inside them
function stripUrls(text) {
    return String(text)
        .replace(/\]\([^)]*\)/g, '](#)')           // markdown link targets
        .replace(/<(https?:\/\/|mailto:)[^>]*>/gi, '<#>')
        .replace(/(https?:\/\/|www\.)\S+/gi, '#');
}

function countWords(text) {
    return stripInlineMarkdown(text).split(/\s+/).filter(t => /[A-Za-z0-9]/.test(t)).length;
}

// ---------------------------------------------------------------------------
// Frontmatter line lookup (best effort — null when not determinable)
// ---------------------------------------------------------------------------

// File line of a top-level frontmatter key ("---" is line 1, fm starts line 2)
function fmKeyLine(fmLines, key) {
    const re = new RegExp(`^${key}\\s*:`);
    const idx = fmLines.findIndex(l => re.test(l));
    return idx === -1 ? null : idx + 2;
}

// File line of an indented child key under a top-level parent
function fmChildLine(fmLines, parent, child) {
    const parentRe = new RegExp(`^${parent}\\s*:`);
    const childRe = new RegExp(`^\\s+${child}\\s*:`);
    const start = fmLines.findIndex(l => parentRe.test(l));
    if (start === -1) return null;
    for (let i = start + 1; i < fmLines.length; i++) {
        if (/^\S/.test(fmLines[i])) break;
        if (childRe.test(fmLines[i])) return i + 2;
    }
    return start + 2;
}

// File line of sources[index].subkey (or the item's first line)
function fmSourceLine(fmLines, index, subkey) {
    const start = fmLines.findIndex(l => /^sources\s*:/.test(l));
    if (start === -1) return null;
    let item = -1;
    let itemStart = null;
    for (let i = start + 1; i < fmLines.length; i++) {
        if (/^\S/.test(fmLines[i])) break;
        if (/^\s*-\s/.test(fmLines[i])) {
            item += 1;
            if (item > index) break;
            if (item === index) itemStart = i;
        }
        if (item === index && subkey &&
            new RegExp(`^\\s+(-\\s+)?${subkey}\\s*:`).test(fmLines[i])) {
            return i + 2;
        }
    }
    return itemStart === null ? start + 2 : itemStart + 2;
}

// ---------------------------------------------------------------------------
// Body structure scan (§5 hard rules + §9)
// ---------------------------------------------------------------------------

function scanBodyStructure(bodyLines, bodyStartLine, err) {
    let inFence = false;
    let sawH1 = false;
    let openH1 = false;
    let openH2 = false;
    let pendingH2 = null; // { title, line } awaiting its verdict paragraph

    const closePendingH2 = (reason, line) => {
        if (!pendingH2) return;
        err(pendingH2.line,
            `Section "## ${pendingH2.title}" must open with a standalone paragraph (its Verdict, §5) — found ${reason}${line ? ` at line ${line}` : ''}.`);
        pendingH2 = null;
    };

    bodyLines.forEach((rawLine, i) => {
        const fileLine = bodyStartLine + i;
        const line = rawLine;
        if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
        if (inFence) return;

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            const level = heading[1].length;
            const title = heading[2].trim();
            if (level >= 4) return; // ordinary sub-headings, no tier (§5.4)
            closePendingH2('the next heading', fileLine);
            if (level === 1) {
                sawH1 = true; openH1 = true; openH2 = false;
            } else if (level === 2) {
                if (!openH1) err(fileLine, `"## ${title}" is not nested under a "#" chapter (§5).`);
                openH2 = true;
                pendingH2 = { title, line: fileLine };
            } else if (level === 3) {
                if (!openH2) err(fileLine, `"### ${title}" is not nested under a "##" section (§5).`);
            }
            return;
        }

        if (line.trim() === '') return;

        if (!sawH1) {
            err(fileLine, 'Content found before the first "#" chapter heading (§5).');
            sawH1 = true; // report once
            return;
        }

        if (pendingH2) {
            if (/^\s*([-*+]\s|\d+[.)]\s|>|\|)/.test(line)) {
                closePendingH2('a list/blockquote/table', fileLine);
            } else {
                pendingH2 = null; // opens with a plain paragraph — good
            }
        }
    });

    closePendingH2('no content');
    if (!sawH1) err(null, 'No "#" chapter headings found — the article has no Overview structure (§5).');
}

// Body images (§5 rule 6) — markdown ![alt](path) only; figures must carry
// alt text and resolve to a file inside the article's own assets/ folder.
function scanBodyImages(bodyLines, bodyStartLine, articleDir, err) {
    let inFence = false;
    const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
    bodyLines.forEach((line, i) => {
        if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
        if (inFence) return;
        const fileLine = bodyStartLine + i;
        let m;
        imgRe.lastIndex = 0;
        while ((m = imgRe.exec(line)) !== null) {
            const [, alt, target] = m;
            const src = target.trim().split(/\s+/)[0]; // drop optional "title"
            if (!isNonEmptyString(alt)) {
                err(fileLine, `Image "${src}" is missing alt text — figures require alt text (§5 rule 6).`);
            }
            if (/^https?:\/\//i.test(src)) {
                err(fileLine, `Image "${src}" is an external URL — figures must live in the article's own assets/ folder (§5 rule 6).`);
                continue;
            }
            if (!articleDir) continue;
            const articleDirResolved = path.resolve(articleDir);
            const resolved = path.resolve(articleDirResolved, src.replace(/^\//, ''));
            if (resolved !== articleDirResolved && !resolved.startsWith(articleDirResolved + path.sep)) {
                err(fileLine, `Image path "${src}" resolves outside the article folder (§5 rule 6).`);
                continue;
            }
            if (!fs.existsSync(resolved)) {
                err(fileLine, `Image "${src}" not found in the article folder (§5 rule 6).`);
            }
        }
    });
}

// Raw HTML in the body (§9) — autolinks (<https://…>, <mailto:…>) are markdown
function scanRawHtml(bodyLines, bodyStartLine, err) {
    let inFence = false;
    const tagRe = /<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?\/?>/;
    bodyLines.forEach((line, i) => {
        if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
        if (inFence) return;
        const cleaned = line.replace(/<(https?:\/\/|mailto:)[^>]*>/gi, '');
        const m = cleaned.match(tagRe);
        if (m) err(bodyStartLine + i, `Raw HTML is not allowed in article bodies (§5): "${m[0]}".`);
    });
}

// ---------------------------------------------------------------------------
// Text scans: lexicon, entity register, first person
// ---------------------------------------------------------------------------

function scanLexicon(text, line, where, err) {
    const cleaned = stripUrls(text);
    BANNED_LEXICON.forEach(({ re, label }) => {
        if (re.test(cleaned)) err(line, `Banned phrase (§8.1) in ${where}: ${label}.`);
    });
}

function scanEntityRegister(text, line, where, err) {
    const cleaned = stripUrls(text);
    ENTITY_REGISTER.forEach(({ canonical, variant, ok }) => {
        const matches = cleaned.match(variant) || [];
        matches.forEach(m => {
            if (!ok.test(m)) {
                err(line, `Entity name "${m}" in ${where} — the canonical form is "${canonical}" (§8.1).`);
            }
        });
    });
}

function scanFirstPerson(text, line, err) {
    const cleaned = stripUrls(text);
    FIRST_PERSON_PATTERNS.forEach(({ re, label }) => {
        if (re.test(cleaned)) {
            err(line, `First person ("${label}") is only allowed in type: founder-brief (§7.6).`);
        }
    });
}

// ---------------------------------------------------------------------------
// Takeaways (§4)
// ---------------------------------------------------------------------------

// §4.2 specificity: a point passes if it holds a digit, an ALL-CAPS token
// (SB005, EGM, CHA…), a capitalised multi-word proper noun, a month name,
// a markdown link, a declared entity id, or a canonical-register term
// (reviewer-of-record, evidence packet…). Deliberately permissive — a false
// "unspecific" flag on a good bullet is worse than letting a marginal one
// through.
const MONTH_NAME_RE = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;

function pointIsSpecific(point, entityIds) {
    const text = stripInlineMarkdown(point);
    if (/\d/.test(text)) return true;
    if (/\b[A-Z]{2,}\b/.test(text)) return true;
    if (/\b[A-Z][A-Za-z]*(?:[-\s]+[A-Z][A-Za-z]*)+\b/.test(text)) return true;
    if (MONTH_NAME_RE.test(text)) return true;
    if (/\[[^\]]+\]\([^)]+\)/.test(point)) return true;
    if (ENTITY_REGISTER.some(({ variant }) => { variant.lastIndex = 0; return variant.test(text); })) return true;
    const lower = text.toLowerCase();
    return entityIds.some(id =>
        lower.includes(String(id).toLowerCase()) ||
        lower.includes(String(id).toLowerCase().replace(/-/g, ' ')));
}

// ---------------------------------------------------------------------------
// Boundary triggers (§8.2)
// ---------------------------------------------------------------------------

function requiredBoundaries(metadata, body) {
    const required = new Map(); // value → reason
    const byCluster = BOUNDARY_BY_CLUSTER[metadata.cluster];
    if (byCluster) required.set(byCluster, `cluster: ${metadata.cluster}`);

    const sentences = stripUrls(body).split(/[.!?\n]+/);
    if (/\b(insur\w*|underwrit\w*)\b/i.test(stripUrls(body))) {
        if (!required.has('irdai')) required.set('irdai', 'the body discusses insurance');
    }
    for (const s of sentences) {
        if (/\bfil(?:e|es|ed|ing)\b/i.test(s) &&
            /\b(customs|icegate|shipping bill|bill of entry|egm)\b/i.test(s)) {
            if (!required.has('cha')) required.set('cha', 'the body discusses filing');
        }
        if (/\bclassif\w*\b/i.test(s) && /\b(hs|hsn|cth|tariff|heading)\b/i.test(s)) {
            if (!required.has('classification')) required.set('classification', 'the body makes an HS determination');
        }
    }
    return required;
}

// ---------------------------------------------------------------------------
// The validator
// ---------------------------------------------------------------------------

/**
 * @param {string} filename   e.g. "sb005-igst-refund-blocked.md"
 * @param {string} raw        full file contents
 * @param {object|null} metadata  parsed YAML frontmatter
 * @param {Set<string>} knownSlugs slugs already claimed by earlier files
 * @param {object} options    { projectRoot, articleDir, today: "YYYY-MM-DD" }
 * @returns {{errors: {line: number|null, msg: string}[], warnings: {line: number|null, msg: string}[]}}
 */
function validatePublication(filename, raw, metadata, knownSlugs, options = {}) {
    const errors = [];
    const warnings = [];
    const err = (line, msg) => errors.push({ line, msg });
    const warn = (line, msg) => warnings.push({ line, msg });

    if (!metadata || typeof metadata !== 'object') {
        err(1, 'Missing YAML frontmatter block.');
        return { errors, warnings };
    }

    const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    const fmLines = fmMatch ? fmMatch[1].split('\n') : [];
    const body = fmMatch ? fmMatch[2] : raw;
    const bodyStartLine = fmLines.length + 3; // "---" + fm + "---"
    const bodyLines = body.split('\n');
    const keyLine = (k) => fmKeyLine(fmLines, k);

    // --- retired v1 fields -------------------------------------------------
    if (metadata.category !== undefined) {
        err(keyLine('category'), 'The "category" field was retired in AUTHORING.md v2 — classify with "type" + "cluster" (§2).');
    }
    if (metadata.abstract !== undefined) {
        err(keyLine('abstract'), 'The "abstract" field was retired in AUTHORING.md v2 — its job moved to "takeaways.summary" (§4).');
    }

    // --- identity ------------------------------------------------------------
    for (const field of ['title', 'slug', 'description', 'author']) {
        if (!isNonEmptyString(metadata[field])) {
            err(keyLine(field), `Missing required frontmatter field: "${field}".`);
        }
    }
    if (metadata.slug) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(metadata.slug)) {
            err(keyLine('slug'), `Slug "${metadata.slug}" is not kebab-case.`);
        }
        if (path.basename(filename, '.md') !== metadata.slug) {
            err(keyLine('slug'), `Filename "${filename}" does not match slug "${metadata.slug}".`);
        }
        if (knownSlugs.has(metadata.slug)) {
            err(keyLine('slug'), `Duplicate slug "${metadata.slug}".`);
        }
    }
    if (isNonEmptyString(metadata.title) && metadata.title.length > 70) {
        err(keyLine('title'), `Title is ${metadata.title.length} chars (max 70, §3).`);
    }
    if (isNonEmptyString(metadata.description)) {
        const len = metadata.description.length;
        if (len < 150 || len > 160) {
            err(keyLine('description'), `Description is ${len} chars (must be 150–160, §3).`);
        }
    }

    // --- classification --------------------------------------------------------
    const type = metadata.type;
    if (!isNonEmptyString(type)) {
        err(keyLine('type'), 'Missing required frontmatter field: "type".');
    } else if (!TYPES[type]) {
        err(keyLine('type'), `type "${type}" is not one of §2.1: ${Object.keys(TYPES).join(' · ')}.`);
    } else if (options.folderType && type !== options.folderType) {
        err(keyLine('type'), `type "${type}" does not match its folder — this article lives under content/publications/${options.folderType}/, so type must be "${options.folderType}" (§1).`);
    }
    if (!isNonEmptyString(metadata.cluster)) {
        err(keyLine('cluster'), 'Missing required frontmatter field: "cluster".');
    } else if (!CLUSTERS[metadata.cluster]) {
        err(keyLine('cluster'), `cluster "${metadata.cluster}" is not one of §2.2: ${Object.keys(CLUSTERS).join(' · ')}.`);
    }

    const entityIds = Array.isArray(metadata.entities) ? metadata.entities : [];
    if (type !== 'founder-brief') {
        if (!Array.isArray(metadata.entities) || metadata.entities.length === 0) {
            err(keyLine('entities'), `"entities" is required for type: ${type || '(unset)'} (§3.1) — canonical entity ids, e.g. [sb005, icegate].`);
        }
    }
    entityIds.forEach(id => {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(String(id))) {
            warn(keyLine('entities'), `entities id "${id}" is not a lowercase kebab-case id.`);
        }
    });

    // --- dates -----------------------------------------------------------------
    for (const field of ['date', 'reviewed']) {
        if (!isNonEmptyString(String(metadata[field] ?? ''))) {
            err(keyLine(field), `Missing required frontmatter field: "${field}".`);
        } else if (!isValidIsoDate(metadata[field])) {
            err(keyLine(field), `"${field}" must be a valid ISO date (YYYY-MM-DD), got "${metadata[field]}".`);
        }
    }
    if (metadata.updated !== undefined && !isValidIsoDate(metadata.updated)) {
        err(keyLine('updated'), `"updated" must be a valid ISO date (YYYY-MM-DD), got "${metadata.updated}".`);
    }
    if (isValidIsoDate(metadata.date) && isValidIsoDate(metadata.reviewed) && metadata.reviewed < metadata.date) {
        err(keyLine('reviewed'), `"reviewed" (${metadata.reviewed}) is before "date" (${metadata.date}) — it must be the same day or later.`);
    }

    // --- takeaways (§4) ----------------------------------------------------------
    const tk = metadata.takeaways;
    if (!tk || typeof tk !== 'object' || Array.isArray(tk)) {
        err(keyLine('takeaways'), '"takeaways" (mapping with "summary" and "points") is required for every type (§4).');
    } else {
        if (!isNonEmptyString(tk.summary)) {
            err(fmChildLine(fmLines, 'takeaways', 'summary'), '"takeaways.summary" is required — a 40–60 word standalone answer (§4.1).');
        } else {
            const words = countWords(tk.summary);
            if (words < 40 || words > 60) {
                err(fmChildLine(fmLines, 'takeaways', 'summary'), `takeaways.summary is ${words} words (must be 40–60, §4.1).`);
            }
        }
        if (!Array.isArray(tk.points) || tk.points.length === 0) {
            err(fmChildLine(fmLines, 'takeaways', 'points'), '"takeaways.points" is required — 3–5 bullets (§4.2).');
        } else {
            if (tk.points.length < 3 || tk.points.length > 5) {
                err(fmChildLine(fmLines, 'takeaways', 'points'), `takeaways.points has ${tk.points.length} items (must be 3–5, §4.2).`);
            }
            tk.points.forEach((p, i) => {
                const line = fmChildLine(fmLines, 'takeaways', 'points');
                if (!isNonEmptyString(p)) {
                    err(line, `takeaways.points #${i + 1} is empty or not a string.`);
                    return;
                }
                if (!pointIsSpecific(p, entityIds)) {
                    err(line, `takeaways.points #${i + 1} has no named entity, date, number or citable procedure (§4.2): "${p.slice(0, 60)}…"`);
                }
                if (p.length > 240) {
                    warn(line, `takeaways.points #${i + 1} is ${p.length} chars (keep them scannable, ≤ ~200).`);
                }
            });
        }
    }

    // --- sources (§6) --------------------------------------------------------------
    const sourcesRequired = SOURCES_REQUIRED_TYPES.includes(type);
    const sources = metadata.sources;
    if (sourcesRequired && (!Array.isArray(sources) || sources.length === 0)) {
        err(keyLine('sources'), `"sources" is required for type: ${type} (§3.1) — primary sources with clause-level anchors.`);
    }
    if (sources !== undefined && !Array.isArray(sources)) {
        err(keyLine('sources'), '"sources" must be a YAML list (§3).');
    }
    if (Array.isArray(sources)) {
        sources.forEach((s, i) => {
            const at = (sub) => fmSourceLine(fmLines, i, sub);
            if (!s || typeof s !== 'object') {
                err(at(null), `sources[${i + 1}] is not a mapping.`);
                return;
            }
            for (const field of ['id', 'title', 'authority', 'url', 'anchor', 'retrieved']) {
                if (!isNonEmptyString(String(s[field] ?? ''))) {
                    err(at(field), `sources[${i + 1}] ("${s.title || s.id || '?'}") is missing "${field}".`);
                }
            }
            if (isNonEmptyString(s.authority) && !AUTHORITIES[s.authority]) {
                err(at('authority'), `sources[${i + 1}] authority "${s.authority}" is not one of §6.2: ${Object.keys(AUTHORITIES).join(' · ')}.`);
            }
            if (isNonEmptyString(s.url) && !/^https?:\/\//.test(s.url)) {
                err(at('url'), `sources[${i + 1}] url must start with http(s)://, got "${s.url}".`);
            }
            if (s.retrieved !== undefined && !isValidIsoDate(s.retrieved)) {
                err(at('retrieved'), `sources[${i + 1}] "retrieved" must be a valid ISO date, got "${s.retrieved}".`);
            }
            if (isNonEmptyString(s.anchor) && isNonEmptyString(s.title)) {
                const anchor = s.anchor.trim().toLowerCase().replace(/\s+/g, ' ');
                const title = s.title.trim().toLowerCase().replace(/\s+/g, ' ');
                if (title.includes(anchor)) {
                    err(at('anchor'), `sources[${i + 1}] anchor "${s.anchor}" restates the document title — point at the clause ("para 3(b)"), not the document (§6.1).`);
                }
            }
        });
    }
    if (!isNonEmptyString(metadata.reviewer)) {
        err(keyLine('reviewer'), 'Missing required frontmatter field: "reviewer" (§3.1 — who checked it before publish).');
    }

    // --- boundary (§8.2) ---------------------------------------------------------------
    const boundary = metadata.boundary;
    if (boundary !== undefined && !Array.isArray(boundary)) {
        err(keyLine('boundary'), '"boundary" must be a YAML list (§8.2).');
    }
    const boundaryValues = Array.isArray(boundary) ? boundary : [];
    boundaryValues.forEach(v => {
        if (!['irdai', 'cha', 'classification'].includes(v)) {
            err(keyLine('boundary'), `boundary value "${v}" is not one of: irdai · cha · classification (§8.2).`);
        }
    });
    for (const [value, reason] of requiredBoundaries(metadata, body)) {
        if (!boundaryValues.includes(value)) {
            err(keyLine('boundary'), `boundary must include "${value}" because ${reason} (§8.2).`);
        }
    }

    // --- optional fields -------------------------------------------------------------
    if (metadata.image) {
        const imgPath = path.join(options.articleDir || options.projectRoot || process.cwd(), String(metadata.image).replace(/^\//, ''));
        if (!fs.existsSync(imgPath)) {
            err(keyLine('image'), `Frontmatter image not found relative to the article folder: "${metadata.image}".`);
        }
    }
    if (metadata.tags !== undefined) {
        if (!Array.isArray(metadata.tags)) {
            err(keyLine('tags'), '"tags" must be a YAML list.');
        } else {
            if (metadata.tags.length < 3 || metadata.tags.length > 7) {
                warn(keyLine('tags'), `tags has ${metadata.tags.length} items (recommended 3–7).`);
            }
            metadata.tags.forEach(t => {
                if (String(t) !== String(t).toLowerCase()) {
                    warn(keyLine('tags'), `tag "${t}" should be lowercase.`);
                }
            });
        }
    }
    if (metadata.faq !== undefined) {
        if (!Array.isArray(metadata.faq)) {
            err(keyLine('faq'), '"faq" must be a list of {q, a} mappings (§3).');
        } else {
            metadata.faq.forEach((f, i) => {
                if (!f || typeof f !== 'object' || !isNonEmptyString(f.q) || !isNonEmptyString(f.a)) {
                    err(keyLine('faq'), `faq #${i + 1} must have non-empty "q" and "a".`);
                }
            });
        }
    }
    for (const field of ['supersedes', 'superseded_by']) {
        if (metadata[field] !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(metadata[field]))) {
            warn(keyLine(field), `"${field}" should be a kebab-case slug, got "${metadata[field]}".`);
        }
    }

    // --- body structure (§5) -----------------------------------------------------------
    scanBodyStructure(bodyLines, bodyStartLine, err);
    scanRawHtml(bodyLines, bodyStartLine, err);
    scanBodyImages(bodyLines, bodyStartLine, options.articleDir, err);

    // --- lexicon, entity register, first person (§8.1, §7.6) -----------------------------
    let inFence = false;
    bodyLines.forEach((line, i) => {
        if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
        if (inFence) return;
        const fileLine = bodyStartLine + i;
        scanLexicon(line, fileLine, 'body', err);
        scanEntityRegister(line, fileLine, 'body', err);
        if (type !== 'founder-brief') scanFirstPerson(line, fileLine, err);
    });

    const fmTextFields = [
        ['title', metadata.title, keyLine('title')],
        ['description', metadata.description, keyLine('description')],
        ['takeaways.summary', tk && tk.summary, fmChildLine(fmLines, 'takeaways', 'summary')],
        ...(tk && Array.isArray(tk.points)
            ? tk.points.map((p, i) => [`takeaways.points #${i + 1}`, p, fmChildLine(fmLines, 'takeaways', 'points')])
            : []),
        ...(Array.isArray(metadata.faq)
            ? metadata.faq.flatMap((f, i) => [
                [`faq #${i + 1} q`, f && f.q, keyLine('faq')],
                [`faq #${i + 1} a`, f && f.a, keyLine('faq')]
            ])
            : [])
    ];
    fmTextFields.forEach(([where, text, line]) => {
        if (!isNonEmptyString(text)) return;
        scanLexicon(text, line, where, err);
        scanEntityRegister(text, line, where, err);
    });

    // --- advisory: staleness (§9) ----------------------------------------------------------
    const today = options.today || new Date().toISOString().slice(0, 10);
    if (TYPES[type] && isValidIsoDate(metadata.reviewed)) {
        const ageDays = Math.floor(
            (new Date(`${today}T00:00:00Z`) - new Date(`${metadata.reviewed}T00:00:00Z`)) / 86400000);
        const threshold = TYPES[type].stalenessDays;
        if (ageDays > threshold) {
            warn(keyLine('reviewed'), `reviewed ${metadata.reviewed} is ${ageDays} days old — over the ${threshold}-day staleness threshold for ${type}. Re-verify against sources.`);
        }
    }

    return { errors, warnings };
}

module.exports = { validatePublication, isValidIsoDate };
