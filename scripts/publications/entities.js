/**
 * Shared schema.org entity nodes.
 *
 * Every generated page's @graph references `#organization` (as `publisher`) and
 * `#website` (as `isPartOf`). Search engines evaluate structured data one page
 * at a time, so a bare `{"@id": ".../#organization"}` reference only resolves if
 * the node it names is defined *on that same page*. These nodes were previously
 * defined only on index.html, which left `publisher` dangling — pointing at an
 * empty node — on all 15 articles, 4 hubs and the catalog, degrading Article
 * rich-result eligibility across the entire publications surface.
 *
 * Defining them here and spreading them into each page's graph keeps the single
 * source of truth while making every page independently resolvable. The values
 * mirror the Organization/WebSite blocks in index.html — keep them in sync.
 */

const BASE_URL = 'https://kananlabs.in';

function organizationNode() {
    return {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Kanan Labs',
        url: `${BASE_URL}/`,
        logo: `${BASE_URL}/assets/images/KANAN-LABS-WEBSITELOGO.png`,
        description: 'AI-native trade intelligence and trade infrastructure company. Builders of TradeWatch and the India AI Tracker.',
        email: 'sreenath@kananlabs.in',
        sameAs: ['https://www.linkedin.com/in/sreenathgovindarajan'],
        founder: {
            '@type': 'Person',
            name: 'Sreenath Govindarajan',
            url: 'https://www.linkedin.com/in/sreenathgovindarajan'
        }
    };
}

function webSiteNode() {
    return {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: `${BASE_URL}/`,
        name: 'Kanan Labs',
        publisher: { '@id': `${BASE_URL}/#organization` },
        inLanguage: 'en'
    };
}

/** The two nodes every generated page must carry so its @id references resolve. */
function siteEntityNodes() {
    return [organizationNode(), webSiteNode()];
}

module.exports = { organizationNode, webSiteNode, siteEntityNodes, BASE_URL };
