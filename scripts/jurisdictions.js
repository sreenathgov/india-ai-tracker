const jurisdictions = require('../data/jurisdictions.json');

function toSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function validateJurisdictions(records = jurisdictions) {
  const codes = new Set();
  const slugs = new Set();

  records.forEach(record => {
    if (!record.name || !record.code || !record.slug) {
      throw new Error(`Invalid jurisdiction record: ${JSON.stringify(record)}`);
    }

    if (codes.has(record.code)) {
      throw new Error(`Duplicate jurisdiction code: ${record.code}`);
    }
    codes.add(record.code);

    if (slugs.has(record.slug)) {
      throw new Error(`Duplicate jurisdiction slug: ${record.slug}`);
    }
    slugs.add(record.slug);
  });

  return records;
}

function aliasRedirects(records = jurisdictions) {
  return records.flatMap(record => {
    const aliasSlugs = new Set((record.aliases || []).map(toSlug));
    aliasSlugs.delete(record.slug);

    return Array.from(aliasSlugs).map(slug => ({
      source: `/states/${slug}/`,
      destination: `/states/${record.slug}/`
    }));
  });
}

module.exports = {
  jurisdictions,
  validateJurisdictions,
  aliasRedirects,
  toSlug
};
