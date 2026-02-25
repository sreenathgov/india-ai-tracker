#!/usr/bin/env python3
"""
Append the current week's feature vectors to the longitudinal trends file.

Reads api/state-scores.json (produced by generate_state_scores.py v2) and
appends a snapshot to api/trends/state-activity.json, keyed by week date.

Run this AFTER generate_state_scores.py, every Sunday.

Output file format (v2 — feature vectors per state per week):
    {
      "2026-02-23": {
        "KA": {
          "article_count": 32,
          "policy_readiness_score": 45,
          "innovation_velocity_score": 72,
          "research_academic_score": 38,
          "infrastructure_depth_score": 15,
          "incumbent_activity_score": 55,
          "challenger_activity_score": 68
        },
        "DL": { ... }
      },
      "2026-02-16": { ... }
    }

Usage:
    python3 backend/scripts/update_trends.py
"""

import json
import os
import sys
from datetime import datetime


# Feature vector keys to store in trends (for momentum calculation)
TREND_VECTOR_KEYS = [
    'policy_readiness_score',
    'enabling_policy_score',
    'restrictive_policy_score',
    'innovation_velocity_score',
    'research_academic_score',
    'infrastructure_depth_score',
    'incumbent_activity_score',
    'challenger_activity_score',
]


def update_trends():
    """Append the current week's feature vectors to the trends file."""

    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_root = os.path.normpath(os.path.join(script_dir, '..', '..', 'api'))

    scores_path = os.path.join(api_root, 'state-scores.json')
    trends_dir = os.path.join(api_root, 'trends')
    trends_path = os.path.join(trends_dir, 'state-activity.json')

    print("=" * 60)
    print("UPDATING STATE ACTIVITY TRENDS (v2 — Feature Vectors)")
    print("=" * 60)

    # ── Load current scores ──────────────────────────────────────────────
    if not os.path.exists(scores_path):
        print(f"\n  Scores file not found: {scores_path}")
        print("  Run generate_state_scores.py first.")
        sys.exit(1)

    try:
        with open(scores_path, 'r', encoding='utf-8') as f:
            scores_data = json.load(f)
    except Exception as e:
        print(f"\n  Failed to read {scores_path}: {e}")
        sys.exit(1)

    week_date = scores_data.get('generated_at',
                                datetime.utcnow().date().isoformat())

    # v2 format uses 'states' key; v1 used 'scores'
    states = scores_data.get('states', scores_data.get('scores', {}))

    if not states:
        print("\n  No state data in state-scores.json. Nothing to append.")
        sys.exit(0)

    print(f"\n  Week date:       {week_date}")
    print(f"  States to record: {len(states)}")

    # ── Load existing trends file ────────────────────────────────────────
    os.makedirs(trends_dir, exist_ok=True)

    if os.path.exists(trends_path):
        try:
            with open(trends_path, 'r', encoding='utf-8') as f:
                trends = json.load(f)
            print(f"  Existing trends:  {len(trends)} weeks loaded")
        except Exception as e:
            print(f"  Could not read trends file, starting fresh: {e}")
            trends = {}
    else:
        trends = {}
        print("  No existing trends file — creating new one")

    # ── Check for existing week ──────────────────────────────────────────
    if week_date in trends:
        print(f"\n  Week {week_date} already recorded.")
        overwrite = os.getenv('TRENDS_OVERWRITE', '').lower() in (
            '1', 'true', 'yes'
        )
        if not overwrite:
            print("  Set TRENDS_OVERWRITE=true to re-record.")
            print("  No changes made.")
            return

        print("  TRENDS_OVERWRITE=true — overwriting existing entry.")

    # ── Build week snapshot (feature vectors only — keep file lean) ──────
    week_snapshot = {}
    for state_code, data in states.items():
        state_snap = {
            'article_count': data.get('article_count', 0),
        }

        # Extract feature vectors
        # v2 format: data['feature_vectors']['policy_readiness_score']
        # v1 fallback: data['breakdown']['policy'] etc.
        vectors = data.get('feature_vectors', {})
        if vectors:
            for vk in TREND_VECTOR_KEYS:
                state_snap[vk] = vectors.get(vk, 0)
        else:
            # v1 compatibility: map old breakdown to vector names
            breakdown = data.get('breakdown', {})
            state_snap['policy_readiness_score'] = breakdown.get('policy', 0)
            state_snap['innovation_velocity_score'] = breakdown.get('startup', 0)
            state_snap['research_academic_score'] = breakdown.get('research', 0)

        week_snapshot[state_code] = state_snap

    # ── Append and write ─────────────────────────────────────────────────
    trends[week_date] = week_snapshot

    # Sort by date descending
    sorted_trends = dict(
        sorted(trends.items(), key=lambda x: x[0], reverse=True)
    )

    with open(trends_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_trends, f, ensure_ascii=False, indent=2)

    print(f"\n  Trends file updated: {trends_path}")
    print(f"  Total weeks recorded: {len(sorted_trends)}")

    # ── Show week-over-week changes ──────────────────────────────────────
    weeks = sorted(sorted_trends.keys(), reverse=True)
    if len(weeks) >= 2:
        prev_week = weeks[1]
        prev_data = sorted_trends[prev_week]

        print(f"\n  Top vector changes ({prev_week} -> {week_date}):")
        print(f"  {'State':<6} {'Vector':<30} {'Prev':>5} {'Curr':>5} {'Delta':>6}")
        print("  " + "-" * 58)

        # Collect all changes across all states and vectors
        all_changes = []
        for state_code in week_snapshot:
            curr = week_snapshot[state_code]
            prev = prev_data.get(state_code, {})
            for vk in TREND_VECTOR_KEYS:
                curr_val = curr.get(vk, 0)
                prev_val = prev.get(vk, 0)
                delta = curr_val - prev_val
                if delta != 0:
                    all_changes.append((state_code, vk, prev_val, curr_val, delta))

        # Show top 10 changes by absolute delta
        all_changes.sort(key=lambda x: abs(x[4]), reverse=True)
        for state_code, vk, prev_val, curr_val, delta in all_changes[:10]:
            arrow = "+" if delta > 0 else ""
            vk_short = vk.replace('_score', '')
            print(f"  {state_code:<6} {vk_short:<30} {prev_val:>5} {curr_val:>5} {arrow}{delta:>5}")


if __name__ == "__main__":
    update_trends()
