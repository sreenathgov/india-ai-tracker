'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Reads the canonical article store and returns one frozen, de-duplicated list.
 *
 * The store is split across two tiers that are near-disjoint: a national file
 * and one file per jurisdiction. `url` is the real primary key — `id` is a
 * leftover rowid from whichever ephemeral run inserted the record and repeats
 * across files.
 */

function readJson(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read ${file}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Malformed JSON in ${file}: ${err.message}`);
  }
}

function articlesOf(doc, file) {
  const categories = doc && doc.categories;
  if (!categories || typeof categories !== 'object' || Array.isArray(categories)) {
    throw new Error(`${file} has no "categories" object`);
  }
  const out = [];
  for (const [name, list] of Object.entries(categories)) {
    if (!Array.isArray(list)) throw new Error(`${file} category "${name}" is not an array`);
    out.push(...list);
  }
  return out;
}

/**
 * @param {string} rootDir repository root (or a fixture root) containing `api/`
 * @returns {ReadonlyArray<Readonly<object>>} unique articles, frozen
 */
function loadCorpus(rootDir) {
  const nationalFile = path.join(rootDir, 'api', 'all-india', 'categories.json');
  if (!fs.existsSync(nationalFile)) {
    throw new Error(`Corpus national tier missing: ${nationalFile}`);
  }

  const files = [nationalFile];
  const statesDir = path.join(rootDir, 'api', 'states');
  if (fs.existsSync(statesDir)) {
    for (const entry of fs.readdirSync(statesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const file = path.join(statesDir, entry.name, 'categories.json');
      if (fs.existsSync(file)) files.push(file);
    }
  }

  const byUrl = new Map();
  for (const file of files) {
    for (const article of articlesOf(readJson(file), file)) {
      const url = article && article.url;
      if (typeof url !== 'string' || url === '') continue;
      const existing = byUrl.get(url);
      if (existing) {
        // Same article filed under several jurisdictions: union the codes.
        const merged = new Set([...existing.state_codes, ...(article.state_codes || [])]);
        byUrl.set(url, { ...existing, state_codes: [...merged] });
        continue;
      }
      byUrl.set(url, { ...article, state_codes: [...(article.state_codes || [])] });
    }
  }

  if (byUrl.size === 0) {
    throw new Error(`Corpus national tier yielded no articles: ${nationalFile}`);
  }

  return Object.freeze([...byUrl.values()].map((a) => Object.freeze(a)));
}

module.exports = { loadCorpus };
