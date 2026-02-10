# GitHub Actions Workflow Updates

**Important:** Due to GitHub PAT workflow scope restrictions, the workflow file changes couldn't be pushed automatically. You need to apply these updates manually.

## File to Update

`.github/workflows/daily-scrape.yml`

## Changes Required

### 1. Replace the "Download existing database" step

**OLD:**
```yaml
      - name: Download existing database (if exists)
        run: |
          cd backend
          if [ -f tracker.db ]; then
            echo "Database already exists locally"
          else
            echo "No existing database found - will create new one"
          fi
```

**NEW:**
```yaml
      - name: Check canonical data store
        run: |
          echo "📂 Checking canonical JSON data store..."
          if [ -f api/all-india/categories.json ]; then
            NATIONAL_COUNT=$(python3 -c "
            import json
            with open('api/all-india/categories.json', 'r') as f:
                data = json.load(f)
                total = sum(len(articles) for articles in data.get('categories', {}).values())
                print(total)
            ")
            echo "✓ Canonical store has $NATIONAL_COUNT national articles"
          else
            echo "⚠️  No existing canonical data - starting fresh"
          fi
```

---

### 2. Replace the entire "Run scraper and pipeline" step

**Replace the entire step with:**

```yaml
      - name: Run scraper and pipeline
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          OLLAMA_DISABLED: "true"
          SCRAPE_TIME_WINDOW_HOURS: "24"  # Only scrape articles from last 24 hours
        run: |
          cd backend

          # Record canonical JSON count BEFORE scraping
          echo "📊 Checking canonical store before scraping..."
          API_COUNT_BEFORE=$(python3 -c "
          import json
          import os
          try:
              with open('../api/all-india/categories.json', 'r') as f:
                  data = json.load(f)
                  total = sum(len(articles) for articles in data.get('categories', {}).values())
                  print(total)
          except:
              print('0')
          " 2>/dev/null || echo "0")
          echo "Canonical JSON has $API_COUNT_BEFORE national articles before scraping"

          echo ""
          echo "Step 1: Running scraper with 24h time window..."
          echo "  (Global deduplication against canonical JSON)"
          echo "  (Time window: last 24 hours only)"
          PYTHONPATH=. python3 -c "
          from scrapers.orchestrator import run_all_scrapers
          result = run_all_scrapers()
          print(f'\\nFinal: {result.get(\"final_processed\", 0)} new articles after dedup & filtering')
          "

          echo ""
          echo "Step 2: Running 3-layer AI processing pipeline..."
          PYTHONPATH=. python3 ai/integrated_pipeline.py

          echo ""
          echo "Step 3: Merging into canonical JSON store..."
          echo "  (Using MERGE logic - never reduces count)"
          PYTHONPATH=. python3 scripts/generate_static_api.py

          # Verify canonical JSON was updated (should increase or stay same, never decrease)
          echo ""
          echo "🔍 Verifying merge results..."
          API_COUNT_AFTER=$(python3 -c "
          import json
          try:
              with open('../api/all-india/categories.json', 'r') as f:
                  data = json.load(f)
                  total = sum(len(articles) for articles in data.get('categories', {}).values())
                  print(total)
          except:
              print('0')
          " 2>/dev/null || echo "0")
          echo "Canonical JSON now has $API_COUNT_AFTER national articles"

          if [ "$API_COUNT_AFTER" -lt "$API_COUNT_BEFORE" ]; then
            echo "❌ ERROR: Article count DECREASED ($API_COUNT_BEFORE → $API_COUNT_AFTER)!"
            echo "❌ This violates the 'never reduce count' invariant!"
            echo "❌ Refusing to commit - this is a critical bug!"
            exit 1
          fi

          echo "✅ Merge successful: $API_COUNT_BEFORE → $API_COUNT_AFTER (+$(($API_COUNT_AFTER - $API_COUNT_BEFORE)))"
          echo ""
          echo "Step 4: Complete!"
```

---

### 3. Replace the "Commit and push changes" step

**Replace with:**

```yaml
      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"

          # Add canonical API files (the source of truth)
          # Database is temp store only - not committed
          git add api/ || true
          git add backend/reports/*.json || true

          # Check if there are changes to commit
          if git diff --staged --quiet; then
            echo "No changes to commit (no new articles after deduplication)"
          else
            # Count how many articles were added
            API_COUNT=$(python3 -c "
            import json
            try:
                with open('api/all-india/categories.json', 'r') as f:
                    data = json.load(f)
                    total = sum(len(articles) for articles in data.get('categories', {}).values())
                    print(total)
            except:
                print('unknown')
            " 2>/dev/null || echo "unknown")

            git commit -m "Daily update: Merge new articles into canonical store - $(date +'%Y-%m-%d %H:%M IST')

Total national articles: $API_COUNT

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
            git push
          fi
```

---

### 4. Replace the "Generate summary and log counts" step

**Replace with:**

```yaml
      - name: Generate summary and log counts
        run: |
          mkdir -p backend/reports

          # Log canonical store counts (source of truth)
          python3 -c "
          import json
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
          import os
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
          with open('backend/reports/daily_counts.log', 'a') as f:
              f.write(f'{today}: National={national_total}, States={state_total} ({states_with_data} states)\\n')
          " || echo "Could not generate summary"
```

---

## How to Apply These Changes

### Option 1: Via GitHub Web UI (Recommended)

1. Go to your repository on GitHub
2. Navigate to `.github/workflows/daily-scrape.yml`
3. Click the "Edit" button (pencil icon)
4. Make the 4 changes listed above
5. Commit directly to main branch

### Option 2: Via Git on Your Computer

1. Open `.github/workflows/daily-scrape.yml` in a text editor
2. Make the 4 changes listed above
3. Commit and push:
   ```bash
   git add .github/workflows/daily-scrape.yml
   git commit -m "Update workflow for merge-based architecture"
   git push
   ```

---

## What These Changes Do

1. **Check canonical store** - Verifies JSON files exist and shows current count
2. **Add time window env var** - Sets `SCRAPE_TIME_WINDOW_HOURS=24`
3. **Update verification** - Checks JSON count (not DB count) before/after
4. **Merge verification** - Aborts if count decreases (safety check)
5. **Commit only JSON** - Database is no longer committed (temp store only)
6. **Better logging** - Shows canonical store counts, not database counts

---

## Testing After Update

After applying the workflow changes, trigger a manual run:

1. Go to Actions tab on GitHub
2. Select "Daily AI Tracker Scrape"
3. Click "Run workflow"
4. Select "main" branch
5. Click "Run workflow"

Expected behavior:
- Should show canonical JSON count before/after
- Should merge articles (not overwrite)
- Should only commit if count increased or stayed same
- Should show "Global deduplication" and "24h time window" messages

---

## Rollback Instructions

If something goes wrong, you can restore the old workflow:

```bash
git checkout 8bec626 -- .github/workflows/daily-scrape.yml
git commit -m "Rollback workflow to previous version"
git push
```

(Replace `8bec626` with the commit hash before the architectural redesign)
