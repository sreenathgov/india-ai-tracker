"""Keyword-based relevance filtering, per function-axis cluster.

No LLM call in v1: sources are already narrow by construction (especially
tier-1 government/regulator feeds), so this mainly disambiguates the
broader general-press feeds. Matching is restricted to a source's declared
candidate clusters — a keyword hit for a cluster the source was never
tagged with is ignored.
"""

from collections.abc import Sequence

from signal_intake.models import INTEL_CLUSTERS

CLUSTER_KEYWORDS: dict[str, tuple[str, ...]] = {
    "trade_policy_tariffs": (
        "tariff",
        "tariffs",
        "trade deal",
        "trade agreement",
        "trade policy",
        "trade war",
        "import duty",
        "import duties",
        "section 301",
        "section 232",
        "free trade agreement",
        "customs duty",
        "trade negotiation",
    ),
    "export_control_sanctions": (
        "export control",
        "export controls",
        "entity list",
        "sanction",
        "sanctions",
        "uflpa",
        "forced labor",
        "forced labour",
        "withhold release order",
        "ofac",
        "denied persons",
        "embargo",
        "dual-use",
        "export administration regulations",
    ),
    "working_capital_trade_finance": (
        "trade finance",
        "working capital",
        "treds",
        "factoring",
        "invoice discounting",
        "letter of credit",
        "bank guarantee",
        "credit guarantee",
        "supply chain finance",
        "receivables finance",
        "nbfc",
        "priority sector lending",
        "trade credit insurance",
        "export credit",
    ),
    "supply_chain_disruption_inputs": (
        "supply chain",
        "shipping delay",
        "port congestion",
        "freight rate",
        "freight rates",
        "logistics disruption",
        "raw material shortage",
        "semiconductor shortage",
        "commodity price",
        "shipping container",
        "chokepoint",
        "red sea",
        "panama canal",
        "supplier disruption",
    ),
    "esg_cbam_labour_compliance": (
        "cbam",
        "carbon border",
        "esg",
        "labour compliance",
        "labor compliance",
        "forced labor",
        "forced labour",
        "supply chain due diligence",
        "human rights due diligence",
        "sustainability reporting",
        "emissions reporting",
        "garment worker",
        "factory audit",
    ),
    "market_funding_competition": (
        "funding round",
        "series a",
        "series b",
        "series c",
        "venture capital",
        "acquisition",
        "acquires",
        "raises",
        "valuation",
        "ipo",
        "merger",
        "investment round",
        "seed round",
    ),
    "ai_governed_technology": (
        "ai act",
        "artificial intelligence regulation",
        "ai governance",
        "ai policy",
        "algorithmic accountability",
        "ai risk management",
        "foundation model",
        "frontier model",
        "ai safety",
        "responsible ai",
    ),
}


def matched_clusters(
    title: str, summary: str, candidate_clusters: Sequence[str]
) -> tuple[str, ...]:
    """Return the subset of `candidate_clusters` whose keywords appear in
    `title`/`summary` (case-insensitive substring match), preserving the
    order of `candidate_clusters`.
    """
    for cluster in candidate_clusters:
        if cluster not in INTEL_CLUSTERS:
            raise ValueError(
                f"unknown cluster {cluster!r}, must be one of {sorted(INTEL_CLUSTERS)}"
            )

    text = f"{title} {summary}".lower()
    if not text.strip():
        return ()

    matches = []
    for cluster in candidate_clusters:
        keywords = CLUSTER_KEYWORDS[cluster]
        if any(keyword in text for keyword in keywords):
            matches.append(cluster)
    return tuple(matches)
