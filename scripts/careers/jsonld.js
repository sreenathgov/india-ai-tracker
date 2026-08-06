/**
 * schema.org graphs for the careers surface.
 *
 * Every page spreads siteEntityNodes(). Search engines evaluate structured
 * data one page at a time, so `hiringOrganization: {"@id": ".../#organization"}`
 * only resolves if the Organization node is defined on that same page — the
 * dangling-reference bug documented at scripts/publications/entities.js:1-15.
 */

const { siteEntityNodes, BASE_URL } = require('../publications/entities');
const { SCHEMA_EMPLOYMENT_TYPE, escapeHtml } = require('./schema');

const CAREERS_URL = `${BASE_URL}/careers.html`;

/** Where the company actually sits. Used for on-site and hybrid roles. */
function companyPlace() {
    return {
        '@type': 'Place',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Bengaluru',
            addressRegion: 'Karnataka',
            addressCountry: 'IN'
        }
    };
}

/**
 * Google wants the JD as an HTML string, not plain text. Compose it from the
 * same fields the page renders so the two never drift.
 */
function jobDescriptionHtml(role) {
    const paragraphs = String(role.description || '')
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `<p>${escapeHtml(p)}</p>`)
        .join('');

    const section = (heading, items) => {
        if (!Array.isArray(items) || !items.length) return '';
        return `<h3>${heading}</h3><ul>`
            + items.map(i => `<li>${escapeHtml(i)}</li>`).join('')
            + '</ul>';
    };

    return paragraphs
        + section('What you&#39;ll do', role.responsibilities)
        + section('What we look for', role.lookingFor)
        + section('Nice to have', role.niceToHave);
}

function jobPostingNode(role) {
    const url = `${BASE_URL}/careers/${role.slug}/`;

    const node = {
        '@type': 'JobPosting',
        '@id': `${url}#jobposting`,
        title: role.title,
        name: role.title,
        description: jobDescriptionHtml(role),
        datePosted: role.datePosted,
        employmentType: SCHEMA_EMPLOYMENT_TYPE[role.employmentType],
        hiringOrganization: { '@id': `${BASE_URL}/#organization` },
        industry: 'International Trade and Trade Compliance Software',
        occupationalCategory: role.team,
        url,
        directApply: true
    };

    if (role.applyBy) {
        // End-of-day IST on the closing date, so a posting does not expire a
        // day early for a candidate applying from India.
        node.validThrough = `${role.applyBy}T23:59:59+05:30`;
    }

    if (role.workMode === 'remote') {
        node.jobLocationType = 'TELECOMMUTE';
        node.applicantLocationRequirements = { '@type': 'Country', name: 'India' };
        node.jobLocation = companyPlace();
    } else {
        node.jobLocation = companyPlace();
    }

    return node;
}

function breadcrumbNode(role) {
    const items = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Careers', item: CAREERS_URL }
    ];
    if (role) {
        items.push({
            '@type': 'ListItem',
            position: 3,
            name: role.title,
            item: `${BASE_URL}/careers/${role.slug}/`
        });
    }
    return { '@type': 'BreadcrumbList', itemListElement: items };
}

/** CollectionPage + ItemList + BreadcrumbList + site entities, for careers.html. */
function listingJsonLd(roles) {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${CAREERS_URL}#collection`,
                url: CAREERS_URL,
                name: 'Careers — Kanan Labs',
                description: 'Open roles at Kanan Labs across engineering, knowledge and trade practice.',
                isPartOf: { '@id': `${BASE_URL}/#website` },
                publisher: { '@id': `${BASE_URL}/#organization` }
            },
            {
                '@type': 'ItemList',
                '@id': `${CAREERS_URL}#roles`,
                numberOfItems: roles.length,
                itemListElement: roles.map((role, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: `${BASE_URL}/careers/${role.slug}/`,
                    name: role.title
                }))
            },
            breadcrumbNode(null),
            ...siteEntityNodes()
        ]
    }, null, 4);
}

/**
 * JobPosting + BreadcrumbList + site entities, for one role page.
 * A closed role gets no JobPosting node — advertising a filled position in
 * structured data is a Google policy violation, not just untidy.
 */
function roleJsonLd(role, { advertised }) {
    const graph = [];
    if (advertised) graph.push(jobPostingNode(role));
    graph.push(breadcrumbNode(role), ...siteEntityNodes());

    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 4);
}

module.exports = { listingJsonLd, roleJsonLd, CAREERS_URL };
