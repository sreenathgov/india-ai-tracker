/**
 * contract.js — the AUTHORING.md v2 enums and registers, as data.
 *
 * This module is the single in-code mirror of content/publications/AUTHORING.md.
 * The validator, the article renderer, the catalog/hub generator and llms.txt
 * all read from here. If AUTHORING.md changes, change this file to match — never
 * the other way around (AUTHORING.md wins on "is this article valid").
 */

// --- §2.1 type ---------------------------------------------------------------

const TYPES = {
    'operational-note': { label: 'Operational Note', stalenessDays: 180 },
    'change-watch':     { label: 'Change Watch',     stalenessDays: 90 },
    'concept-piece':    { label: 'Concept Piece',    stalenessDays: 365 },
    'founder-brief':    { label: 'Founder Brief',    stalenessDays: 365 },
    'definition':       { label: 'Definition',       stalenessDays: 365 }
};

// Types on which sources[] is REQUIRED (§3.1)
const SOURCES_REQUIRED_TYPES = ['operational-note', 'change-watch'];

// --- §2.2 cluster ------------------------------------------------------------
// `hub` is the hub-page H1 (from AUTHORING.md §2.2). `description` is the hub's
// standing description — editorial copy, safe to reword.

const CLUSTERS = {
    'igst-customs': {
        hub: 'IGST & Customs Readiness',
        personas: 'Export manager · Finance · CHA',
        description: 'How IGST refunds, Shipping Bill errors and pre-LEO reconciliation actually behave on ICEGATE — and the readiness work that prevents blocked refunds.'
    },
    'marine-evidence': {
        hub: 'Marine Cargo Evidence',
        personas: 'Broker · Compliance officer',
        description: 'Where marine cargo claims fail on evidence: time-bars, certificates, surveys — and the evidence packet that makes a claim defensible.'
    },
    'ev-lithium': {
        hub: 'EV & Lithium Export',
        personas: 'EV founder · Export manager · OEM procurement',
        description: 'Export mechanics for EV and lithium-battery cargo: HS 8507 classification, dangerous-goods documentation, and the approvals that gate shipment.'
    },
    'export-realization': {
        hub: 'Export Realization',
        personas: 'Finance',
        description: 'From Let Export Order to realized payment: e-BRC, RoDTEP, refunds, and the reconciliation between what was shipped and what was credited.'
    },
    'trade-architecture': {
        hub: 'Trade Intelligence Architecture',
        personas: 'Investor · Hire · Sophisticated buyer',
        description: 'How Kanan Labs builds trade intelligence: source-attributed data, validated-at-source pipelines, and the architecture behind TradeWatch.'
    },
    'ai-trade-compliance': {
        hub: 'AI in Trade Compliance',
        personas: 'Compliance lead · Trade operations · Technology buyer',
        description: 'What artificial intelligence can and cannot decide in cross-border compliance: the legal limits on delegation, the evidence an AI-assisted determination must carry, and how to evaluate systems that claim to do this work.'
    }
};

// --- §6.2 authority ----------------------------------------------------------

const AUTHORITIES = {
    'cbic': 'CBIC',
    'dgft': 'DGFT',
    'irdai': 'IRDAI',
    'rbi': 'RBI',
    'gstn': 'GSTN',
    'icegate': 'ICEGATE',
    'india-statute': 'Indian statute',
    'india-court': 'Indian court',
    'eu': 'EU',
    'us': 'US',
    'un-iata-imo': 'UN / IATA / IMO',
    'icc': 'ICC',
    'bis': 'BIS',
    'other': 'Other source'
};

// --- §8.2 boundary — statements are VERBATIM from AUTHORING.md. Never reword. --

const BOUNDARY_STATEMENTS = {
    'irdai': 'Kanan Labs prepares claim-admissible evidence. It does not advise on, select, or bind insurance — your IRDAI-licensed broker does.',
    'cha': 'Kanan Labs prepares a readiness packet. It does not file Shipping Bills and holds no customs credentials — your licensed CHA files.',
    'classification': 'Final HS classification requires human review.'
};

// boundary[] values required by cluster membership (§8.2 table, "Required when")
const BOUNDARY_BY_CLUSTER = {
    'marine-evidence': 'irdai',
    'igst-customs': 'cha'
};

// --- §8.1 lexicon — banned phrases and constructions, validator-blocking ------
// Inflections: "disrupt" is banned as a verb (disrupt/disrupts/disrupted/
// disrupting); the noun "disruption" is a legitimate trade term and is allowed.

const BANNED_LEXICON = [
    { re: /\brevolutionary\b/i,                     label: 'revolutionary' },
    { re: /\bdisrupt(?:s|ed|ing)?\b/i,              label: 'disrupt' },
    { re: /\bgame[-\s]chang(?:ing|er|ers)\b/i,      label: 'game-changing' },
    { re: /\bseamless magic\b/i,                    label: 'seamless magic' },
    { re: /\bai[-\s]powered\b/i,                    label: 'AI-powered' },
    { re: /\bone[-\s]click\b/i,                     label: 'one-click' },
    { re: /\bguarantee[sd]?\s+compliance\b/i,       label: 'guarantee compliance' },
    { re: /\bensur(?:e|es|ed|ing)\s+compliance\b/i, label: 'ensure compliance' },
    { re: /\bget your money back\b/i,               label: 'get your money back' },
    { re: /\breplace your cha\b/i,                  label: 'replace your CHA' },
    { re: /\breplace your broker\b/i,               label: 'replace your broker' },
    { re: /\bagi for trade\b/i,                     label: 'AGI for trade' },
    { re: /\bend[-\s]to[-\s]end automation\b/i,     label: 'end-to-end automation' },
    { re: /\bwe file\b/i,                           label: '"we file"' },
    { re: /\bwe bind\b/i,                           label: '"we bind"' },
    { re: /\brecommended insurer\b/i,               label: '"recommended insurer"' },
    { re: /\bguaranteed refund\b/i,                 label: '"guaranteed refund"' },
    { re: /\bfully automated compliance\b/i,        label: '"fully automated compliance"' }
];

// --- §8.1 canonical entity register --------------------------------------------
// `variant` finds every spelling/casing/hyphenation of the entity; `ok` accepts
// only the canonical form (sentence-initial capitals allowed for the lowercase
// hyphenated terms; "evidence packets" plural allowed).

const ENTITY_REGISTER = [
    { canonical: 'Kanan Labs',           variant: /\bkanan[\s-]?labs\b/gi,                 ok: /^Kanan Labs$/ },
    { canonical: 'TradeWatch',           variant: /\btrade[\s-]?watch\b/gi,                ok: /^TradeWatch$/ },
    { canonical: 'DRONA',                variant: /\bdrona\b/gi,                           ok: /^DRONA$/ },
    { canonical: 'SectorWatch',          variant: /\bsector[\s-]?watch\b/gi,               ok: /^SectorWatch$/ },
    { canonical: 'reviewer-of-record',   variant: /\breviewer[\s-]of[\s-]record\b/gi,      ok: /^[Rr]eviewer-of-record$/ },
    { canonical: 'four-state readiness', variant: /\bfour[\s-]state[\s-]readiness\b/gi,    ok: /^[Ff]our-state readiness$/ },
    { canonical: 'validated-at-source',  variant: /\bvalidated[\s-]at[\s-]source\b/gi,     ok: /^[Vv]alidated-at-source$/ },
    { canonical: 'evidence packet',      variant: /\bevidence[\s-]packets?\b/gi,           ok: /^[Ee]vidence packets?$/ }
];

// --- First person (blocked outside founder-brief, body only) -------------------
// "I" only counts when it reads as a pronoun (followed by a lowercase word or a
// contraction) so "Annexure I" and "Phase I" do not false-positive. The
// lookbehind also excludes "I" preceded by a capitalized label word (Annex,
// Table, Schedule, Part, Chapter, Article, Section, Appendix, Class), which
// otherwise false-positives on "Annex I coverage" / "Table I of" — a capital
// numeral I followed by a lowercase word reads identically to a pronoun to the
// forward-only version of this pattern. "us" is matched lowercase-only so the
// country "US" passes.

const FIRST_PERSON_PATTERNS = [
    { re: /(?<![A-Z][a-zA-Z]*\s)\bI(?='m|'ve|'d|'ll|\s+[a-z])/,  label: 'I' },
    { re: /\b[Ww]e\b/,                      label: 'we' },
    { re: /\b[Oo]ur\b/,                     label: 'our' },
    { re: /\b[Oo]urs\b/,                    label: 'ours' },
    { re: /\b[Mm]y\b/,                      label: 'my' },
    { re: /\b[Mm]ine\b/,                    label: 'mine' },
    { re: /\bus\b/,                         label: 'us' },
    { re: /\b[Mm]yself\b/,                  label: 'myself' },
    { re: /\b[Oo]urselves\b/,               label: 'ourselves' }
];

module.exports = {
    TYPES,
    SOURCES_REQUIRED_TYPES,
    CLUSTERS,
    AUTHORITIES,
    BOUNDARY_STATEMENTS,
    BOUNDARY_BY_CLUSTER,
    BANNED_LEXICON,
    ENTITY_REGISTER,
    FIRST_PERSON_PATTERNS
};
