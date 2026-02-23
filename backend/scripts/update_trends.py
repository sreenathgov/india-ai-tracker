#!/usr/bin/env python3
"""
Append the current week's state scores to the longitudinal trends file.

Reads api/state-scores.json (produced by generate_state_scores.py) and
appends a snapshot to api/trends/state-activity.json, keyed by week date.

Run this AFTER generate_state_scores.py, every Sunday.

Output file format:
    {
      "2026-02-23": {
        "KA": { "score": 74, "rank": 1, "article_count": 45,
                "top_category": "Major AI Developments" },
        "DL": { "score": 68, "rank": 2, ... },
        ...
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


def update_trends():
    """Append the current week's scores to the trends time-series file."""

    # Locate api/ directory (2 levels up from this script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_root = os.path.normpath(os.path.join(script_dir, '..', '..', 'api'))

    scores_path = os.path.join(api_root, 'state-scores.json')
    trends_dir = os.path.join(api_root, 'trends')
    trends_path = os.path.join(trends_dir, 'state-activity.json')

    print("=" * 60)
    print("UPDATING STATE ACTIVITY TRENDS")
    print("=" * 60)

    # ── Load current scores ──────────────────────────────────────────────────
    if not os.path.exists(scores_path):
        print(f"❌ Scores file not found: {scores_path}")
        print("   Run generate_state_scores.py first.")
        sys.exit(1)

    try:
        with open(scores_path, 'r', encoding='utf-8') as f:
            scores_data = json.load(f)
    except Exception as e:
        print(f"❌ Failed to read {scores_path}: {e}")
        sys.exit(1)

    week_date = scores_data.get('generated_at', datetime.utcnow().date().isoformat())
    scores = scores_data.get('scores', {})

    if not scores:
        print("⚠️  No scores in state-scores.json. Nothing to append.")
        sys.exit(0)

    print(f"\n📅 Week date: {week_date}")
    print(f"📊 States to record: {len(scores)}")

    # ── Load existing trends file ────────────────────────────────────────────
    os.makedirs(trends_dir, exist_ok=True)

    if os.path.exists(trends_path):
        try:
            with open(trends_path, 'r', encoding='utf-8') as f:
                trends = json.load(f)
            print(f"📂 Loaded existing trends ({len(trends)} weeks)")
        except Exception as e:
            print(f"⚠️  Could not read trends file, starting fresh: {e}")
            trends = {}
    else:
        trends = {}
        print("📋 No existing trends file — creating new one")

    # ── Check if this week is already recorded ───────────────────────────────
    if week_date in trends:
        print(f"ℹ️  Week {week_date} is already in the trends file.")
        overwrite = os.getenv('TRENDS_OVERWRITE', '').lower() in ('1', 'true', 'yes')
        if not overwrite:
            print("   Set TRENDS_OVERWRITE=true to re-record this week.")
            print("   No changes made.")
            return

        print("   TRENDS_OVERWRITE=true — overwriting existing entry.")

    # ── Build the week snapshot ──────────────────────────────────────────────
    # Store only the fields needed for trend analysis (keep file lean)
    week_snapshot = {}
    for state_code, data in scores.items():
        week_snapshot[state_code] = {
            'score': data.get('score', 0),
            'rank': data.get('rank', 0),
            'article_count': data.get('article_count', 0),
            'top_category': data.get('top_category'),
            'breakdown': data.get('breakdown', {}),
        }

    # ── Append and write ─────────────────────────────────────────────────────
    trends[week_date] = week_snapshot

    # Sort by date descending (most recent first) for readability
    sorted_trends = dict(
        sorted(trends.items(), key=lambda x: x[0], reverse=True)
    )

    with open(trends_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_trends, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Trends file updated: {trends_path}")
    print(f"   Total weeks recorded: {len(sorted_trends)}")

    # Print a quick diff if previous week exists for a few key states
    weeks = sorted(sorted_trends.keys(), reverse=True)
    if len(weeks) >= 2:
        prev_week = weeks[1]
        prev_data = sorted_trends[prev_week]
        print(f"\n📈 Top 5 state changes ({prev_week} → {week_date}):")

        changes = []
        for state_code in week_snapshot:
            new_score = week_snapshot[state_code]['score']
            old_score = prev_data.get(state_code, {}).get('score', 0)
            delta = new_score - old_score
            changes.append((state_code, new_score, delta))

        changes.sort(key=lambda x: abs(x[2]), reverse=True)
        for state_code, new_score, delta in changes[:5]:
            arrow = '↑' if delta > 0 else ('↓' if delta < 0 else '→')
            delta_str = f"{arrow}{abs(delta)}" if delta != 0 else "→ no change"
            print(f"   {state_code}: {new_score} pts  ({delta_str})")


if __name__ == "__main__":
    update_trends()
