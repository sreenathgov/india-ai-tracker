#!/usr/bin/env python3
"""
Generate State AI Feature Vectors — v2

Produces disaggregated feature vectors per state for NotebookLM intelligence.
Instead of flattening to a single score, outputs 8 independent 0-100 vectors,
momentum deltas, state tiering, and raw breakdowns.

Feature Vectors (each 0-100):
  - policy_readiness_score      Government AI engagement
  - enabling_policy_score       Pro-growth policy activity (grants, funds, schemes)
  - restrictive_policy_score    Regulatory/compliance policy activity
  - innovation_velocity_score   Startup and entrepreneurial AI activity
  - research_academic_score     Academic/research institution AI activity
  - infrastructure_depth_score  AI infrastructure (data centres, compute, chips)
  - incumbent_activity_score    Major corporate AI deployments
  - challenger_activity_score   Grassroots startup/disruptor activity

State Tiering:
  Tier 1: KA, MH, DL, TG, TN, HR, GJ, UP (established AI hubs)
  Tier 2: All other states/UTs

Minimum Activity Gate: ≥5 articles → "sufficient", else "insufficient"

Usage:
    python3 backend/scripts/generate_state_scores.py
"""

import json
import math
import os
import re
import sys
from datetime import datetime, timedelta


# ══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

LOOKBACK_DAYS = 30
MIN_ARTICLES_GATE = 5

# Tier 1: Established AI hub states
TIER_1_STATES = {
    'KA',   # Karnataka (Bengaluru)
    'MH',   # Maharashtra (Mumbai/Pune)
    'DL',   # Delhi (NCR)
    'TG',   # Telangana (Hyderabad)
    'TN',   # Tamil Nadu (Chennai)
    'HR',   # Haryana (Gurugram/NCR)
    'GJ',   # Gujarat (Ahmedabad/GIFT City)
    'UP',   # Uttar Pradesh (Noida/NCR)
}

STATE_NAMES = {
    'AN': 'Andaman & Nicobar', 'AP': 'Andhra Pradesh',
    'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
    'CH': 'Chandigarh', 'CG': 'Chhattisgarh', 'DD': 'Daman & Diu',
    'DL': 'Delhi', 'DN': 'Dadra & NH', 'GA': 'Goa', 'GJ': 'Gujarat',
    'HP': 'Himachal Pradesh', 'HR': 'Haryana', 'JH': 'Jharkhand',
    'JK': 'Jammu & Kashmir', 'KA': 'Karnataka', 'KL': 'Kerala',
    'LA': 'Ladakh', 'LD': 'Lakshadweep', 'MH': 'Maharashtra',
    'ML': 'Meghalaya', 'MN': 'Manipur', 'MP': 'Madhya Pradesh',
    'MZ': 'Mizoram', 'NL': 'Nagaland', 'OD': 'Odisha', 'PB': 'Punjab',
    'PY': 'Puducherry', 'RJ': 'Rajasthan', 'SK': 'Sikkim',
    'TN': 'Tamil Nadu', 'TG': 'Telangana', 'TR': 'Tripura',
    'UK': 'Uttarakhand', 'UP': 'Uttar Pradesh', 'UT': 'Uttarakhand',
    'WB': 'West Bengal',
}


# ══════════════════════════════════════════════════════════════════════════
# KEYWORD PATTERNS (compiled once)
# ══════════════════════════════════════════════════════════════════════════

# Policy classification: Enabling vs Restrictive
ENABLING_KEYWORDS = re.compile(
    r'\b('
    r'grant|fund(?:ing|s|ed)?|subsid(?:y|ies)|'
    r'incubat(?:or|ion)|accelerat(?:or|e)|'
    r'scheme|mission|allocation|'
    r'skill(?:ing|s|ed)?|train(?:ing|ed)?|'
    r'invest(?:ment|ed|ing)?|partnership|'
    r'launch(?:ed|es|ing)?|promot(?:e|ing|ion)|'
    r'support(?:ed|ing)?|initiative|'
    r'boost|develop(?:ment|ed|ing)?|establish(?:ed|ing)?|'
    r'centre of excellence|center of excellence|'
    r'startup|start-up|innovation|'
    r'digital india|smart city|e-governance'
    r')\b',
    re.IGNORECASE
)

RESTRICTIVE_KEYWORDS = re.compile(
    r'\b('
    r'regulat(?:ion|ory|e|ed|ing)|'
    r'compliance|ban(?:ned|ning)?|'
    r'committee|commission(?:ed)?|'
    r'data (?:law|protection|privacy)|'
    r'restrict(?:ion|ed|ive|ing)?|'
    r'audit(?:ed|ing)?|mandat(?:e|ory|ed)|'
    r'framework|guideline|oversight|'
    r'penalt(?:y|ies)|fine(?:d|s)?|'
    r'enforce(?:ment|d|ing)?|monitor(?:ing|ed)?|'
    r'govern(?:ance|ing)|liability|'
    r'transparency|accountability|'
    r'safety standard|ethical|bias'
    r')\b',
    re.IGNORECASE
)

# Research: Academic/research institution patterns
# Premier institutions (IIT, IISc, IIM, national labs)
RESEARCH_PREMIER_RE = re.compile(
    r'\b('
    r'iit[- ]?\w+|iits\b|iit\b|'
    r'iisc\b|'
    r'iim[- ]?\w+|iims\b|iim\b|'
    r'aiims[- ]?\w*|aiims\b|'
    r'isro|drdo|csir|tifr|'
    r'barc|icar|icmr|dae\b|'
    r'isi kolkata|isi\b|nasscom'
    r')\b',
    re.IGNORECASE
)

# Broader academic patterns
RESEARCH_BROAD_RE = re.compile(
    r'\b('
    r'nit[- ]?\w+|nits\b|nit\b|'
    r'iiit[- ]?\w+|iiits\b|iiit\b|'
    r'iiser[- ]?\w*|bits[- ]?\w*|'
    r'university|universities|'
    r'research cent(?:re|er)|research lab|research institute|'
    r'professor|faculty|ph\.?d|doctoral|'
    r'academic|innovation hub|incubator|'
    r'centre of excellence|center of excellence'
    r')\b',
    re.IGNORECASE
)

# Infrastructure keywords
INFRA_RE = re.compile(
    r'\b('
    r'data cent(?:re|er)|gpu|tpu|'
    r'semiconductor|chip\b|fab\b|fabrication|'
    r'computing infrastructure|cloud infrastructure|'
    r'server farm|hyperscale|'
    r'india ai mission|indiaai|digital india|'
    r'bharatgpt|bhashini|airawat|'
    r'supercomputer|param\b|'
    r'national ai mission|national ai portal|'
    r'5g\b|fibre\b|fiber\b|'
    r'smart city|digital infrastructure|'
    r'ai compute|compute capacity'
    r')\b',
    re.IGNORECASE
)

# Incumbent companies (major established corporations)
INCUMBENT_COMPANIES = re.compile(
    r'\b('
    # Major Indian
    r'infosys|tcs\b|tata consultancy|wipro|'
    r'hcl tech|tech mahindra|'
    r'reliance|jio\b|tata group|tata sons|'
    r'adani|mahindra|l&t\b|larsen|'
    r'bharti|airtel|'
    r'hdfc|icici|sbi\b|bajaj|axis bank|'
    r'vedanta|jsw|godrej|'
    # Major Global
    r'google|microsoft|amazon|aws\b|'
    r'meta\b|ibm\b|sap\b|samsung|'
    r'intel\b|nvidia|apple|qualcomm|'
    r'accenture|deloitte|oracle|'
    r'cisco|dell\b|salesforce'
    r')\b',
    re.IGNORECASE
)

# Challenger / startup keywords
CHALLENGER_RE = re.compile(
    r'\b('
    r'seed round|pre-seed|angel round|angel funding|'
    r'series [a-e]|raised|funding round|fund raise|'
    r'new startup|start-?up|founded|launched|'
    r'bootstrap(?:ped)?|disruption|pivot(?:ed)?|'
    r'unicorn|soonicorn|'
    r'venture capital|vc |angel investor'
    r')\b',
    re.IGNORECASE
)


# ══════════════════════════════════════════════════════════════════════════
# ARTICLE LOADING
# ══════════════════════════════════════════════════════════════════════════

def load_state_articles(api_root: str) -> dict:
    """
    Load all articles from state JSON files within the lookback window.

    Returns: { state_code: [article, ...] }
    """
    states_dir = os.path.join(api_root, 'states')
    state_articles = {}

    if not os.path.isdir(states_dir):
        print(f"  States directory not found: {states_dir}")
        return state_articles

    cutoff = (datetime.utcnow() - timedelta(days=LOOKBACK_DAYS)).strftime('%Y-%m-%d')

    for entry in sorted(os.listdir(states_dir)):
        state_dir = os.path.join(states_dir, entry)
        cat_file = os.path.join(state_dir, 'categories.json')

        if not os.path.isdir(state_dir) or not os.path.exists(cat_file):
            continue

        try:
            with open(cat_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"  Could not read {cat_file}: {e}")
            continue

        articles = []
        for category, items in data.get('categories', {}).items():
            for article in items:
                if not article.get('is_approved'):
                    continue
                if article.get('is_deleted'):
                    continue
                if article.get('processing_state') != 'PROCESSED':
                    continue
                pub_date = article.get('date_published', '')
                if pub_date and pub_date < cutoff:
                    continue
                articles.append({**article, 'category': category})

        if articles:
            state_articles[entry] = articles

    return state_articles


# ══════════════════════════════════════════════════════════════════════════
# FEATURE VECTOR CALCULATION
# ══════════════════════════════════════════════════════════════════════════

def _text_of(article: dict) -> str:
    """Get searchable text from an article (title + summary, lowered)."""
    return f"{article.get('title', '')} {article.get('summary', '')}".lower()


def _hybrid_score(count: int, total: int, per_item: int = 6,
                  abs_cap: int = 60, share_weight: int = 40) -> float:
    """
    Hybrid scoring: absolute count + share of total.
    Rewards both volume and concentration without penalizing diverse states.
    """
    absolute = min(count * per_item, abs_cap)
    share = (count / total * share_weight) if total > 0 else 0
    return absolute + share


def classify_policy_article(article: dict) -> str:
    """
    Classify a policy article as 'enabling' or 'restrictive'.
    Returns 'enabling' or 'restrictive'.
    """
    text = _text_of(article)
    enabling_hits = len(ENABLING_KEYWORDS.findall(text))
    restrictive_hits = len(RESTRICTIVE_KEYWORDS.findall(text))

    if restrictive_hits > enabling_hits:
        return 'restrictive'
    return 'enabling'  # default: assume proactive


def compute_feature_vectors(state_code: str, articles: list) -> dict:
    """
    Compute all feature vectors for a single state.

    Returns raw (unnormalized) scores and article breakdowns.
    Normalization across states happens in the caller.
    """
    total = len(articles)

    # ── Article classification ────────────────────────────────────────────
    policy_articles = []
    enabling_articles = []
    restrictive_articles = []
    startup_articles = []
    research_articles = []
    infra_articles = []
    incumbent_articles = []
    challenger_articles = []

    category_counts = {}
    sector_counts = {}

    for article in articles:
        text = _text_of(article)
        cat = article.get('category', 'Major AI Developments')
        sector = article.get('sector', None)

        category_counts[cat] = category_counts.get(cat, 0) + 1
        if sector:
            sector_counts[sector] = sector_counts.get(sector, 0) + 1

        # Policy classification
        if cat == 'Policies and Initiatives':
            policy_articles.append(article)
            pol_type = classify_policy_article(article)
            if pol_type == 'enabling':
                enabling_articles.append(article)
            else:
                restrictive_articles.append(article)

        # Startup / innovation
        if cat == 'AI Start-Up News':
            startup_articles.append(article)

        # Research: prefer Groq sector tag, fall back to regex
        is_research = False
        if sector == 'research':
            is_research = True
        elif RESEARCH_PREMIER_RE.search(text) or RESEARCH_BROAD_RE.search(text):
            is_research = True
        if is_research:
            research_articles.append(article)

        # Infrastructure
        if INFRA_RE.search(text):
            infra_articles.append(article)

        # Incumbent vs Challenger
        has_incumbent = bool(INCUMBENT_COMPANIES.search(text))
        has_challenger = bool(CHALLENGER_RE.search(text))

        if has_incumbent:
            incumbent_articles.append(article)
        if has_challenger and not has_incumbent:
            # Pure challenger: startup activity without incumbent involvement
            challenger_articles.append(article)
        elif cat == 'AI Start-Up News' and not has_incumbent:
            # Startup category articles without incumbent mention = challenger
            challenger_articles.append(article)

    # ── Raw scores (before normalization) ─────────────────────────────────

    # Policy readiness
    policy_raw = _hybrid_score(len(policy_articles), total)

    # Enabling / Restrictive policy (same hybrid formula)
    enabling_raw = _hybrid_score(len(enabling_articles), total)
    restrictive_raw = _hybrid_score(len(restrictive_articles), total)

    # Innovation velocity
    innovation_raw = _hybrid_score(len(startup_articles), total)

    # Research academic
    # Quality bonus: articles matching premier institutions get extra weight
    premier_count = sum(
        1 for a in research_articles
        if RESEARCH_PREMIER_RE.search(_text_of(a))
    )
    research_base = min(len(research_articles) * 10, 70)
    research_quality = min(premier_count * 5, 30)
    research_raw = research_base + research_quality

    # Infrastructure depth (each infra article is high-signal)
    infra_raw = min(len(infra_articles) * 15, 100)

    # Incumbent activity
    # Bonus: diversity of incumbents mentioned
    incumbent_names_seen = set()
    for a in incumbent_articles:
        matches = INCUMBENT_COMPANIES.findall(_text_of(a))
        incumbent_names_seen.update(m.lower() for m in matches)
    incumbent_base = min(len(incumbent_articles) * 8, 80)
    incumbent_diversity = 20 if len(incumbent_names_seen) >= 3 else 0
    incumbent_raw = incumbent_base + incumbent_diversity

    # Challenger activity
    # Bonus: sector diversity among challengers
    challenger_sectors = set()
    for a in challenger_articles:
        s = a.get('sector')
        if s and s != 'general':
            challenger_sectors.add(s)
    challenger_base = min(len(challenger_articles) * 8, 80)
    challenger_diversity = 20 if len(challenger_sectors) >= 3 else 0
    challenger_raw = challenger_base + challenger_diversity

    # Top category and sector
    top_category = max(category_counts, key=category_counts.get) if category_counts else None
    top_sector = max(sector_counts, key=sector_counts.get) if sector_counts else None

    return {
        'raw_vectors': {
            'policy_readiness': policy_raw,
            'enabling_policy': enabling_raw,
            'restrictive_policy': restrictive_raw,
            'innovation_velocity': innovation_raw,
            'research_academic': research_raw,
            'infrastructure_depth': infra_raw,
            'incumbent_activity': incumbent_raw,
            'challenger_activity': challenger_raw,
        },
        'breakdown': {
            'policy_articles': len(policy_articles),
            'enabling_policy_articles': len(enabling_articles),
            'restrictive_policy_articles': len(restrictive_articles),
            'startup_articles': len(startup_articles),
            'research_articles': len(research_articles),
            'infrastructure_articles': len(infra_articles),
            'incumbent_articles': len(incumbent_articles),
            'challenger_articles': len(challenger_articles),
            'top_category': top_category,
            'top_sector': top_sector,
            'sector_distribution': sector_counts,
        },
        'article_count': total,
    }


def normalize_vectors(all_raw: dict) -> dict:
    """
    Normalize raw vectors to 0-100 scale across all states.

    For each vector dimension, find the max across all states and scale
    all values to 0-100 relative to that max.
    """
    vector_names = [
        'policy_readiness', 'enabling_policy', 'restrictive_policy',
        'innovation_velocity', 'research_academic', 'infrastructure_depth',
        'incumbent_activity', 'challenger_activity',
    ]

    # Find max for each dimension
    maxes = {}
    for vname in vector_names:
        max_val = max(
            (data['raw_vectors'].get(vname, 0) for data in all_raw.values()),
            default=1
        )
        maxes[vname] = max_val if max_val > 0 else 1

    # Normalize each state
    normalized = {}
    for state_code, data in all_raw.items():
        vectors = {}
        for vname in vector_names:
            raw_val = data['raw_vectors'].get(vname, 0)
            normalized_val = round((raw_val / maxes[vname]) * 100)
            vectors[vname + '_score'] = min(normalized_val, 100)

        normalized[state_code] = vectors

    return normalized


def compute_momentum(current_vectors: dict, trends_path: str) -> dict:
    """
    Compute week-over-week momentum deltas for each feature vector.

    Returns: { state_code: { vector_name_delta: int, ... } }
    Returns None values if no previous week data exists.
    """
    momentum = {}
    prev_week_data = None

    # Load previous week from trends file
    if os.path.exists(trends_path):
        try:
            with open(trends_path, 'r', encoding='utf-8') as f:
                trends = json.load(f)
            # Get the most recent week (first key when sorted descending)
            weeks = sorted(trends.keys(), reverse=True)
            if weeks:
                prev_week_data = trends[weeks[0]]
                print(f"  Previous week data loaded: {weeks[0]}")
        except Exception as e:
            print(f"  Could not load trends for momentum: {e}")

    vector_keys = [
        'policy_readiness_score', 'innovation_velocity_score',
        'research_academic_score', 'infrastructure_depth_score',
        'incumbent_activity_score', 'challenger_activity_score',
    ]

    for state_code, vectors in current_vectors.items():
        state_momentum = {}

        if prev_week_data and state_code in prev_week_data:
            prev = prev_week_data[state_code]
            for vk in vector_keys:
                delta_key = vk.replace('_score', '_delta')
                current_val = vectors.get(vk, 0)
                prev_val = prev.get(vk, 0)
                state_momentum[delta_key] = current_val - prev_val

            # Article count delta
            state_momentum['article_count_delta'] = (
                vectors.get('_article_count', 0) -
                prev.get('article_count', 0)
            )
        else:
            # No previous data — all deltas null
            for vk in vector_keys:
                delta_key = vk.replace('_score', '_delta')
                state_momentum[delta_key] = None
            state_momentum['article_count_delta'] = None

        momentum[state_code] = state_momentum

    return momentum


# ══════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ══════════════════════════════════════════════════════════════════════════

def generate_state_scores():
    """Main entry point — compute feature vectors, momentum, write output."""

    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_root = os.path.normpath(os.path.join(script_dir, '..', '..', 'api'))
    trends_dir = os.path.join(api_root, 'trends')
    trends_path = os.path.join(trends_dir, 'state-activity.json')

    print("=" * 70)
    print("STATE AI FEATURE VECTOR GENERATOR v2")
    print("=" * 70)
    print(f"\n  API root:        {api_root}")
    print(f"  Lookback:        {LOOKBACK_DAYS} days")
    print(f"  Activity gate:   {MIN_ARTICLES_GATE} articles")
    print(f"  Tier 1 states:   {', '.join(sorted(TIER_1_STATES))}")
    print()

    # ── Load articles ─────────────────────────────────────────────────────
    print("Loading state articles...")
    state_articles = load_state_articles(api_root)

    if not state_articles:
        print("  No state articles found. Aborting.")
        sys.exit(1)

    total_articles = sum(len(v) for v in state_articles.values())
    print(f"  Loaded {total_articles} articles from {len(state_articles)} states\n")

    # ── Compute raw vectors ───────────────────────────────────────────────
    print("Computing feature vectors...")
    all_raw = {}
    for state_code, articles in state_articles.items():
        all_raw[state_code] = compute_feature_vectors(state_code, articles)

    # ── Normalize to 0-100 ────────────────────────────────────────────────
    print("Normalizing vectors across states...")
    normalized = normalize_vectors(all_raw)

    # Attach article count to normalized for momentum calculation
    for state_code in normalized:
        normalized[state_code]['_article_count'] = all_raw[state_code]['article_count']

    # ── Compute momentum ──────────────────────────────────────────────────
    print("Computing momentum deltas...")
    momentum = compute_momentum(normalized, trends_path)

    # ── Build output ──────────────────────────────────────────────────────
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())

    states_output = {}
    for state_code in sorted(all_raw.keys()):
        article_count = all_raw[state_code]['article_count']
        tier = 1 if state_code in TIER_1_STATES else 2
        sufficiency = 'sufficient' if article_count >= MIN_ARTICLES_GATE else 'insufficient'

        # Build feature vectors dict (remove internal _article_count)
        vectors = {k: v for k, v in normalized[state_code].items()
                   if not k.startswith('_')}

        states_output[state_code] = {
            'state_name': STATE_NAMES.get(state_code, state_code),
            'tier': tier,
            'article_count': article_count,
            'data_sufficiency': sufficiency,
            'feature_vectors': vectors,
            'momentum': momentum.get(state_code, {}),
            'breakdown': all_raw[state_code]['breakdown'],
        }

    output = {
        'generated_at': today.isoformat(),
        'week_of': week_start.isoformat(),
        'lookback_days': LOOKBACK_DAYS,
        'states_scored': len(states_output),
        'states': states_output,
    }

    # ── Write output ──────────────────────────────────────────────────────
    output_path = os.path.join(api_root, 'state-scores.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # ── Print summary ─────────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print("FEATURE VECTOR SUMMARY")
    print(f"{'=' * 70}\n")

    # Sort by innovation velocity for display
    sorted_states = sorted(
        states_output.items(),
        key=lambda x: x[1]['feature_vectors'].get('innovation_velocity_score', 0),
        reverse=True
    )

    header = (f"{'State':<18} {'Tier':>4} {'Art':>4} {'Suff':>6}  "
              f"{'Policy':>6} {'Innov':>6} {'Rsrch':>6} {'Infra':>6} "
              f"{'Incum':>6} {'Chall':>6}")
    print(header)
    print("-" * len(header))

    for state_code, data in sorted_states:
        fv = data['feature_vectors']
        suff = "✓" if data['data_sufficiency'] == 'sufficient' else "✗"
        name = data['state_name'][:17]
        print(f"{name:<18} {data['tier']:>4} {data['article_count']:>4} {suff:>6}  "
              f"{fv.get('policy_readiness_score', 0):>6} "
              f"{fv.get('innovation_velocity_score', 0):>6} "
              f"{fv.get('research_academic_score', 0):>6} "
              f"{fv.get('infrastructure_depth_score', 0):>6} "
              f"{fv.get('incumbent_activity_score', 0):>6} "
              f"{fv.get('challenger_activity_score', 0):>6}")

    print(f"\n  Tier 1 states: {sum(1 for _, d in sorted_states if d['tier'] == 1)}")
    print(f"  Tier 2 states: {sum(1 for _, d in sorted_states if d['tier'] == 2)}")
    print(f"  Sufficient data: {sum(1 for _, d in sorted_states if d['data_sufficiency'] == 'sufficient')}")
    print(f"  Insufficient:    {sum(1 for _, d in sorted_states if d['data_sufficiency'] == 'insufficient')}")

    # Show policy split for top states
    print(f"\n{'=' * 70}")
    print("POLICY SPLIT (Enabling vs Restrictive)")
    print(f"{'=' * 70}\n")

    policy_states = [(sc, d) for sc, d in sorted_states
                     if d['breakdown']['policy_articles'] > 0]
    if policy_states:
        for state_code, data in policy_states[:10]:
            bd = data['breakdown']
            fv = data['feature_vectors']
            print(f"  {data['state_name']:<20} "
                  f"Policy:{bd['policy_articles']} "
                  f"(Enabling:{bd['enabling_policy_articles']} "
                  f"Restrictive:{bd['restrictive_policy_articles']})  "
                  f"Scores: E={fv.get('enabling_policy_score', 0)} "
                  f"R={fv.get('restrictive_policy_score', 0)}")
    else:
        print("  No states with policy articles in this period.")

    print(f"\n  Output: {output_path}")
    print(f"  {len(states_output)} states scored\n")


if __name__ == "__main__":
    generate_state_scores()
