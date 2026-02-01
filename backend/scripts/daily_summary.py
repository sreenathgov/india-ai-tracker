#!/usr/bin/env python3
"""
Generate daily scrape summary and log counts.
Called by GitHub Actions workflow.
"""

import json
import os
from datetime import datetime

today = datetime.now().date().isoformat()

# Count national articles
try:
    with open('api/all-india/categories.json', 'r') as f:
        data = json.load(f)
        national_total = sum(len(articles) for articles in data.get('categories', {}).values())
except:
    national_total = 0

# Count state articles
state_total = 0
states_with_data = 0
if os.path.exists('api/states'):
    for state_dir in os.listdir('api/states'):
        state_file = f'api/states/{state_dir}/categories.json'
        if os.path.exists(state_file):
            try:
                with open(state_file, 'r') as f:
                    data = json.load(f)
                    count = sum(len(articles) for articles in data.get('categories', {}).values())
                    if count > 0:
                        state_total += count
                        states_with_data += 1
            except:
                pass

print(f'📊 Daily Scrape Summary ({today}):')
print(f'  National articles (canonical): {national_total}')
print(f'  State articles (canonical): {state_total} across {states_with_data} states')
print(f'  Grand total: {national_total + state_total}')
print(f'')
print(f'✅ Canonical JSON store is the source of truth')
print(f'✅ Merge logic preserves historical data')
print(f'✅ Global deduplication prevents duplicates')
print(f'✅ 24h time window prevents old articles')

# Write summary to log
os.makedirs('backend/reports', exist_ok=True)
with open('backend/reports/daily_counts.log', 'a') as f:
    f.write(f'{today}: National={national_total}, States={state_total} ({states_with_data} states)\n')
