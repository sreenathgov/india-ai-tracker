#!/usr/bin/env python3
"""
Generate weekly State AI Performance Scores.

Reads the canonical JSON files in api/states/*/categories.json and
api/all-india/categories.json, calculates a composite score for each
state, and writes api/state-scores.json.

Run this manually or via the Sunday GitHub Actions workflow.

Score formula (0-100):
  Policy Activity       30% — share of a state's articles in "Policies and Initiatives"
  Startup Ecosystem     25% — share of a state's articles in "AI Start-Up News"
  Development Velocity  25% — articles per million population, normalised 0-100
  Research Signal       20% — articles mentioning IIT/IISc/university (capped at 20)

Usage:
    python3 backend/scripts/generate_state_scores.py
"""

import json
import os
import re
import sys
from datetime import datetime, timedelta

# ── Population data (2024 estimates, millions) ──────────────────────────────
# Used for velocity normalisation (articles per million people).
# Source: Census 2011 projections + UNFPA estimates. Roughly correct, never
# needs to be exact — the purpose is relative ranking, not absolute accuracy.
STATE_POPULATION_M = {
    'AN': 0.4,    # Andaman & Nicobar Islands
    'AP': 53.0,   # Andhra Pradesh
    'AR': 1.7,    # Arunachal Pradesh
    'AS': 35.0,   # Assam
    'BR': 125.0,  # Bihar
    'CH': 1.2,    # Chandigarh
    'CG': 32.0,   # Chhattisgarh
    'DD': 0.6,    # Daman & Diu + Dadra & NH
    'DL': 33.0,   # Delhi
    'DN': 0.6,    # Dadra & Nagar Haveli
    'GA': 1.6,    # Goa
    'GJ': 70.0,   # Gujarat
    'HP': 7.5,    # Himachal Pradesh
    'HR': 31.0,   # Haryana
    'JH': 38.0,   # Jharkhand
    'JK': 13.5,   # Jammu & Kashmir
    'KA': 68.0,   # Karnataka
    'KL': 35.0,   # Kerala
    'LA': 0.3,    # Ladakh
    'LD': 0.07,   # Lakshadweep
    'MH': 126.0,  # Maharashtra
    'ML': 3.5,    # Meghalaya
    'MN': 3.3,    # Manipur
    'MP': 85.0,   # Madhya Pradesh
    'MZ': 1.3,    # Mizoram
    'NL': 2.2,    # Nagaland
    'OD': 46.0,   # Odisha
    'PB': 30.0,   # Punjab
    'PY': 1.6,    # Puducherry
    'RJ': 81.0,   # Rajasthan
    'SK': 0.7,    # Sikkim
    'TN': 80.0,   # Tamil Nadu
    'TG': 40.0,   # Telangana
    'TR': 4.2,    # Tripura
    'UK': 11.0,   # Uttarakhand
    'UP': 240.0,  # Uttar Pradesh
    'UT': 11.0,   # Uttarakhand (alias — same as UK)
    'WB': 100.0,  # West Bengal
}

# Human-readable state names for output
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

# Regex for research signal: articles mentioning academic institutions
RESEARCH_RE = re.compile(
    r'\b(iit|iits|iisc|iim|iims|iiser|iiit|nit |nits|'
    r'university|universities|college|research institute|'
    r'anna university|jadavpur|osmania|pune university)\b',
    re.IGNORECASE
)

# Look-back window for article relevance (days)
LOOKBACK_DAYS = 30


def load_state_articles(api_root: str) -> dict:
    """
    Load all articles from state JSON files.

    Returns a dict: { state_code: [article, ...] }
    """
    states_dir = os.path.join(api_root, 'states')
    state_articles = {}

    if not os.path.isdir(states_dir):
        print(f"⚠️  States directory not found: {states_dir}")
        return state_articles

    cutoff_date = (datetime.utcnow() - timedelta(days=LOOKBACK_DAYS)).strftime('%Y-%m-%d')

    for entry in sorted(os.listdir(states_dir)):
        state_dir = os.path.join(states_dir, entry)
        cat_file = os.path.join(state_dir, 'categories.json')

        if not os.path.isdir(state_dir) or not os.path.exists(cat_file):
            continue

        try:
            with open(cat_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"  ⚠️  Could not read {cat_file}: {e}")
            continue

        articles = []
        for category, items in data.get('categories', {}).items():
            for article in items:
                # Only count approved, non-deleted, processed articles
                if not article.get('is_approved'):
                    continue
                if article.get('is_deleted'):
                    continue
                if article.get('processing_state') != 'PROCESSED':
                    continue
                # Only count articles within look-back window
                pub_date = article.get('date_published', '')
                if pub_date and pub_date < cutoff_date:
                    continue
                articles.append({**article, 'category': category})

        if articles:
            state_articles[entry] = articles

    return state_articles


def score_state(state_code: str, articles: list) -> dict:
    """
    Calculate the AI performance score for a single state.

    Args:
        state_code: Two-letter state code (e.g. 'KA')
        articles: List of article dicts for this state

    Returns:
        Score breakdown dict
    """
    total = len(articles)
    if total == 0:
        return {
            'score': 0,
            'breakdown': {'policy': 0, 'startup': 0, 'velocity': 0, 'research': 0},
            'article_count': 0,
            'top_category': None
        }

    # Count by category
    category_counts = {}
    for article in articles:
        cat = article.get('category', 'Major AI Developments')
        category_counts[cat] = category_counts.get(cat, 0) + 1

    policy_count = category_counts.get('Policies and Initiatives', 0)
    startup_count = category_counts.get('AI Start-Up News', 0)

    # ── Component 1: Policy Activity (30%) ──────────────────────────────────
    # % of articles about policy, mapped to 0-30 scale
    policy_pct = (policy_count / total) * 100
    policy_pts = round((policy_pct / 100) * 30, 1)

    # ── Component 2: Startup Ecosystem (25%) ────────────────────────────────
    startup_pct = (startup_count / total) * 100
    startup_pts = round((startup_pct / 100) * 25, 1)

    # ── Component 3: Development Velocity (25%) ─────────────────────────────
    # Articles per million population, normalised to 0-25
    # We'll normalise across all states at the end (done in caller)
    pop_m = STATE_POPULATION_M.get(state_code, 10.0)
    raw_velocity = total / pop_m  # articles per million people
    # Store raw value; normalisation happens in generate_scores()
    velocity_raw = raw_velocity

    # ── Component 4: Research Signal (20%) ──────────────────────────────────
    research_count = sum(
        1 for a in articles
        if RESEARCH_RE.search(f"{a.get('title', '')} {a.get('summary', '')}")
    )
    # Each research mention = +2 pts, capped at 20
    research_pts = min(research_count * 2, 20)

    # Determine top category
    top_category = max(category_counts, key=category_counts.get) if category_counts else None

    return {
        '_policy_pts': policy_pts,
        '_startup_pts': startup_pts,
        '_velocity_raw': velocity_raw,
        '_research_pts': research_pts,
        'article_count': total,
        'top_category': top_category,
        'policy_articles': policy_count,
        'startup_articles': startup_count,
        'research_articles': research_count,
    }


def generate_scores(state_articles: dict) -> dict:
    """
    Calculate final scores for all states, normalising velocity.

    Args:
        state_articles: { state_code: [articles] }

    Returns:
        { state_code: score_dict }
    """
    # First pass: compute raw scores for each state
    raw_scores = {}
    for state_code, articles in state_articles.items():
        raw_scores[state_code] = score_state(state_code, articles)

    # Normalise velocity: map the highest velocity to 25 pts
    max_velocity = max(
        (s.get('_velocity_raw', 0) for s in raw_scores.values()),
        default=1
    )
    if max_velocity == 0:
        max_velocity = 1

    # Second pass: compute final scores
    final_scores = {}
    for state_code, raw in raw_scores.items():
        policy_pts = raw.get('_policy_pts', 0)
        startup_pts = raw.get('_startup_pts', 0)
        velocity_pts = round((raw.get('_velocity_raw', 0) / max_velocity) * 25, 1)
        research_pts = raw.get('_research_pts', 0)

        total_score = round(policy_pts + startup_pts + velocity_pts + research_pts)
        total_score = min(total_score, 100)  # Cap at 100

        label = (
            'Leader' if total_score >= 70 else
            'Strong' if total_score >= 50 else
            'Active' if total_score >= 30 else
            'Emerging'
        )

        final_scores[state_code] = {
            'score': total_score,
            'label': label,
            'breakdown': {
                'policy': round(policy_pts),
                'startup': round(startup_pts),
                'velocity': round(velocity_pts),
                'research': round(research_pts),
            },
            'article_count': raw.get('article_count', 0),
            'top_category': raw.get('top_category'),
            'policy_articles': raw.get('policy_articles', 0),
            'startup_articles': raw.get('startup_articles', 0),
            'research_articles': raw.get('research_articles', 0),
        }

    return final_scores


def generate_state_scores():
    """Main entry point — read JSON files, score states, write output."""

    # Locate api/ directory (2 levels up from this script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_root = os.path.normpath(os.path.join(script_dir, '..', '..', 'api'))

    print("=" * 60)
    print("GENERATING STATE AI PERFORMANCE SCORES")
    print("=" * 60)
    print(f"\n📁 API root: {api_root}")
    print(f"📅 Look-back window: last {LOOKBACK_DAYS} days\n")

    # Load articles
    print("📥 Loading state articles from canonical JSON files...")
    state_articles = load_state_articles(api_root)

    if not state_articles:
        print("⚠️  No state articles found. Aborting.")
        sys.exit(1)

    print(f"✅ Loaded articles from {len(state_articles)} states\n")

    # Score states
    print("🧮 Scoring states...")
    scores = generate_scores(state_articles)

    # Rank by score (highest first)
    ranked = sorted(scores.items(), key=lambda x: x[1]['score'], reverse=True)

    # Add rank field
    for rank, (state_code, data) in enumerate(ranked, 1):
        scores[state_code]['rank'] = rank
        scores[state_code]['state_name'] = STATE_NAMES.get(state_code, state_code)

    # Build output
    today = datetime.utcnow().date()
    # Week starts on Monday
    week_start = today - timedelta(days=today.weekday())

    output = {
        'generated_at': today.isoformat(),
        'week_of': week_start.isoformat(),
        'lookback_days': LOOKBACK_DAYS,
        'states_scored': len(scores),
        'scores': scores,
    }

    # Write output
    output_path = os.path.join(api_root, 'state-scores.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # Print leaderboard
    print(f"\n🏆 STATE AI LEADERBOARD (top 10 of {len(ranked)})")
    print("-" * 55)
    print(f"{'Rank':<5} {'State':<22} {'Score':>5}  {'Label':<10} {'Articles':>8}")
    print("-" * 55)

    for i, (state_code, data) in enumerate(ranked[:10], 1):
        name = STATE_NAMES.get(state_code, state_code)
        print(f"{i:<5} {name:<22} {data['score']:>5}  {data['label']:<10} {data['article_count']:>8}")

    print("-" * 55)
    print(f"\n✅ Scores written to: {output_path}")
    print(f"   {len(scores)} states scored")


if __name__ == "__main__":
    generate_state_scores()
