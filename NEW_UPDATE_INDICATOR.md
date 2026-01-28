# New Update Indicator Feature

**Date:** January 28, 2026
**Feature:** Green dot indicator for categories with today's updates

## What Was Added

A visual indicator (green pulsing dot) now appears on category cards when they contain updates that were added in the current scraping cycle (today).

## Implementation

### 1. Backend API Changes

**Files Modified:**
- `backend/app.py` (lines 333-367 and 378-410)

**Changes:**
Both `/api/states/<state_code>/categories` and `/api/all-india/categories` endpoints now return:
```json
{
  "state": "IN",
  "categories": {
    "Policies and Initiatives": [...],
    "Events": [...],
    "Major AI Developments": [...],
    "AI Start-Up News": [...]
  },
  "today_updates": ["Major AI Developments", "Policies and Initiatives", "AI Start-Up News"]
}
```

The `today_updates` array contains category names that have at least one article scraped today.

**Logic:**
```python
# Track which categories have updates from today
today = datetime.utcnow().date()
categories_with_today_updates = set()

for update in updates:
    if update.category in categories:
        categories[update.category].append(update.to_dict())

        # Check if this update was scraped today
        if update.date_scraped and update.date_scraped.date() == today:
            categories_with_today_updates.add(update.category)

return jsonify({
    'state': state_code,
    'categories': categories,
    'today_updates': list(categories_with_today_updates)
})
```

### 2. Frontend JavaScript Changes

**File Modified:** `js/app-final.js`

**Changes:**

1. **Added global variable** (line 76):
   ```javascript
   let currentTodayUpdates = []; // Store list of categories with today's updates
   ```

2. **Updated `fetchStateData()` function** (lines 166-177):
   - Now returns both `categories` and `todayUpdates`
   - Extracts `today_updates` array from API response

3. **Updated `openStatePanel()` function** (lines 178-203):
   - Stores `todayUpdates` in global variable
   - Passes `todayUpdates` to `buildCategoryCards()`

4. **Updated `buildCategoryCards()` function** (lines 207-250):
   - Accepts `todayUpdates` parameter (defaults to empty array)
   - Checks if each category is in the `todayUpdates` array
   - Adds green indicator span if category has today's updates:
     ```javascript
     const hasTodayUpdates = todayUpdates.includes(categoryName);

     html += `
         <div class="card-icon">
             ${config.icon}
             ${hasTodayUpdates ? '<span class="new-indicator" title="New updates today"></span>' : ''}
         </div>
     `;
     ```

5. **Updated `loadAllIndiaContent()` function** (lines 626-641):
   - Stores and passes `today_updates` to `buildCategoryCards()`

### 3. CSS Styling

**File Modified:** `css/styles-v2.css`

**Added Styles** (after line 637):
```css
/* Green indicator dot for new updates today */
.new-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 10px;
    height: 10px;
    background: #10b981;
    border: 2px solid var(--bg-primary);
    border-radius: 50%;
    animation: pulse-indicator 2s ease-in-out infinite;
}

@keyframes pulse-indicator {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}
```

**Design:**
- 10px circular green dot (#10b981 - emerald green)
- Positioned at top-right of category icon
- White border matching background for contrast
- Subtle pulsing animation (2s cycle)
- Tooltip shows "New updates today" on hover

## How It Works

### Flow:

1. **User clicks a state or switches to All India view**
   ↓
2. **Frontend fetches category data from API**
   - Gets `categories` object
   - Gets `today_updates` array
   ↓
3. **Frontend renders category cards**
   - For each category, checks if it's in `today_updates` array
   - If yes, adds `<span class="new-indicator">` to the card icon
   ↓
4. **Green pulsing dot appears** on categories with today's updates
   - Visual indicator that category has new content
   - Helps user quickly identify which categories were updated today

### Example:

If today's scraping added:
- 3 articles to "Major AI Developments"
- 2 articles to "Policies and Initiatives"
- 1 article to "AI Start-Up News"

Then those 3 categories will show the green dot, while "Events" (with no new updates today) won't.

## Visual Design

The indicator:
- ✅ **Subtle but noticeable** - 10px dot with pulsing animation
- ✅ **Color choice** - Emerald green (#10b981) signals "new/fresh"
- ✅ **Positioning** - Top-right of icon, doesn't obstruct the emoji
- ✅ **Animation** - Gentle pulse draws attention without being distracting
- ✅ **Accessibility** - Tooltip provides text description

## Testing

Test the feature:

1. **View All India panel**:
   ```
   Go to http://localhost:8080/index.html
   Click "All India" toggle
   Categories with today's updates will show green dot
   ```

2. **View state panel**:
   ```
   Click any state on the map
   Categories with today's updates will show green dot
   ```

3. **Verify API**:
   ```bash
   curl -s "http://localhost:5001/api/all-india/categories" | python3 -c "
   import sys, json
   data = json.load(sys.stdin)
   print('Today updates:', data.get('today_updates', []))
   "
   ```

## Expected Behavior

### Today (after scraping):
- Categories that received new articles today: **Green dot visible**
- Categories with no new articles today: **No dot**

### Tomorrow (before scraping):
- No categories will have dots (no updates today yet)

### After tomorrow's scraping:
- Only categories updated in tomorrow's scrape will show dots
- Today's updates will no longer show dots (they're from yesterday now)

## Notes

- The indicator uses `date_scraped` field to determine "today"
- Comparison is done using UTC dates
- The dot appears even if the category already had articles - it shows "new additions today"
- The feature works for both state panels and All India panel

## Future Enhancements

Possible improvements:
1. Add different colors for different time ranges (yesterday, this week, etc.)
2. Show count of today's updates on hover
3. Add "New" badge text for mobile where dots might be small
4. Persist "seen" state in localStorage to show truly "new to user"
5. Add admin setting to define "today" window (last 12 hours, last 24 hours, etc.)
