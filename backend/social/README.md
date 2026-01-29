# X (Twitter) Posting for India AI Tracker

This module contains infrastructure for posting AI news summaries to X (Twitter).

## Current Status: Manual Posting

> **Note:** Automatic posting via the X API is currently **disabled** due to X's API pricing changes (as of January 2025). The free tier no longer provides sufficient write access for automated posting.
>
> **Current workflow:** Article summaries are generated in an X-ready format (under 240 characters, professional tone). You can copy them directly from the website and paste to X manually.
>
> The module is kept intact and modular so that automated posting can be re-enabled if you later subscribe to X's Basic API tier (~$200/month).

---

## Manual Posting Workflow

1. Visit [kananlabs.in](https://kananlabs.in)
2. Browse recent articles
3. Copy the summary text for articles you want to share
4. Paste into X with optional additions (link, hashtags, etc.)

The summaries are already optimized for X:
- Under 240 characters (leaves room for links)
- Professional, neutral tone
- Lead with actor + action
- Include geography where relevant

---

## Re-enabling Automated Posting (Future)

If you decide to pay for X API access, follow these steps:

### Step 1: Set Up X Developer Account

You can use your existing X account - no need to create a new one.

#### Get Developer Access

1. Go to [developer.x.com](https://developer.x.com)
2. Sign in with the X account you want to post from
3. Click "Sign up for Free Account" or "Developer Portal"
4. Fill out the required information about your use case:
   - **Use case**: "Sharing AI news summaries from my website"
   - **Will you make Twitter content available to a government entity?**: No
5. Accept the developer agreement

#### Create a Project and App

1. In the Developer Portal, go to "Projects & Apps"
2. Click "Create Project"
   - Name: "India AI Tracker Bot" (or similar)
   - Use case: "Making a bot"
   - Description: "Automated posting of AI news summaries"
3. Create an App within the project
4. Go to your App Settings

#### Generate API Keys

1. In your App settings, find "Keys and Tokens"
2. Generate (or regenerate) these four credentials:
   - **API Key** (Consumer Key)
   - **API Secret** (Consumer Secret)
   - **Access Token**
   - **Access Token Secret**
3. **Important**: Make sure the Access Token has **Read and Write** permissions
   - Go to App Settings > User authentication settings
   - Enable OAuth 1.0a
   - Set App permissions to "Read and write"
   - Save and regenerate your Access Token if needed

---

### Step 2: Add Credentials to .env

Open `backend/.env` and add your credentials:

```bash
# X (Twitter) API Credentials
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here

# Optional: Enable/disable posting (default: false for safety)
X_POSTING_ENABLED=true
```

Replace `your_..._here` with your actual credentials from the X Developer Portal.

---

### Step 3: Test with Dry-Run Mode

Dry-run mode shows you what would be posted without actually posting.

```bash
cd backend

# See ALL articles that would be posted
python3 scripts/post_to_x.py

# Verify your credentials work
python3 scripts/post_to_x.py --verify

# See posting statistics
python3 scripts/post_to_x.py --stats
```

---

### Step 4: Run Live Posting

When you're ready to post for real:

```bash
# Post ALL articles to X (5 minute intervals between posts)
python3 scripts/post_to_x.py --live

# Limit to specific number of posts
python3 scripts/post_to_x.py --live --max-posts 5

# Look back further for articles
python3 scripts/post_to_x.py --live --lookback-days 14

# Change delay between posts (in seconds)
python3 scripts/post_to_x.py --live --delay 60
```

---

## Configuration Options

### Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--live` | false | Actually post to X (without this, it's dry-run) |
| `--max-posts N` | 0 | Maximum posts (0 = unlimited, posts ALL articles) |
| `--lookback-days N` | 7 | How far back to look for articles |
| `--delay N` | 300 | Seconds between posts (default: 5 minutes) |
| `--verify` | - | Just verify credentials |
| `--stats` | - | Show posting statistics |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `X_API_KEY` | (required) | Your X API key |
| `X_API_SECRET` | (required) | Your X API secret |
| `X_ACCESS_TOKEN` | (required) | Your X access token |
| `X_ACCESS_TOKEN_SECRET` | (required) | Your X access token secret |
| `X_POSTING_ENABLED` | false | Feature flag (for integration with daily script) |

---

## How Articles Are Selected

By default, ALL eligible articles are posted (no limit). Articles are selected based on:

1. **Recency**: Only articles from the last 7 days (configurable)
2. **Approval**: Must be approved and not deleted
3. **Not posted**: Skips articles already posted to X
4. **Importance**: Higher importance scores are posted first

Posts are spaced 5 minutes apart to avoid rate limiting and ensure a steady stream throughout the day.

---

## Troubleshooting

### "Credentials not configured"

Make sure all four environment variables are set in `.env`:
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

### "401 Unauthorized"

Your credentials may be invalid or expired:
1. Go to the X Developer Portal
2. Regenerate your Access Token and Secret
3. Update `.env` with the new values
4. Run `python3 scripts/post_to_x.py --verify` to test

### "402 CreditsDepleted"

Your account has no API credits remaining. This is the current limitation with X's free tier:
- The free tier no longer allows meaningful write access
- You need to subscribe to the Basic tier (~$200/month) for automated posting
- Use manual posting workflow instead (copy/paste from website)

### "403 Forbidden"

Your app doesn't have write permissions:
1. Go to Developer Portal > Your App > Settings
2. Check "User authentication settings"
3. Ensure OAuth 1.0a is enabled with "Read and write" permissions
4. Regenerate Access Token after changing permissions

### "429 Rate Limited"

You've hit X's rate limits:
- The script will stop and wait
- Default delay of 5 minutes between posts should prevent this
- If it happens often, increase `--delay` to 600 (10 minutes) or more

---

## Files in This Module

```
social/
├── __init__.py          # Module exports
├── x_client.py          # X API authentication & posting
├── post_formatter.py    # Tweet text formatting
├── post_selector.py     # Article selection logic
└── README.md            # This file

scripts/
├── post_to_x.py         # CLI script for posting
└── migrate_add_x_posting.py  # Database migration
```
