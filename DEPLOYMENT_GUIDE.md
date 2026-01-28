# Production Deployment Guide

This guide walks you through deploying the India AI Tracker to production.

## Architecture Overview

```
┌─────────────────────┐
│   GitHub Actions    │  ← Automated daily scraping & processing
│   (Backend Pipeline)│     Runs at 6 AM IST daily
└──────────┬──────────┘
           │
           │ Commits database updates
           ↓
┌─────────────────────┐
│   GitHub Repo       │  ← Source of truth
│   (tracker.db)      │     Database stored in repo
└──────────┬──────────┘
           │
           │ Deploys on push
           ↓
┌─────────────────────┐
│   Vercel Hosting    │  ← Public frontend
│   (Static Files)    │     Serves HTML/CSS/JS
└─────────────────────┘
```

## Prerequisites

- ✅ GitHub repository (done)
- ✅ Domain name on NameCheap (you have this)
- [ ] Vercel account (free)
- [ ] GitHub secrets configured

---

## Part 1: Configure GitHub Secrets

These API keys are needed for the automated scraping:

### Step 1: Get Your API Keys

1. **Groq API Key:**
   - Go to https://console.groq.com/keys
   - Create new API key
   - Copy it (starts with `gsk_...`)

2. **Gemini API Key:**
   - Go to https://aistudio.google.com/app/apikey
   - Create API key
   - Copy it (starts with `AIza...`)

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repo: https://github.com/sreenathgov/india-ai-tracker
2. Click **Settings** (top menu)
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these two secrets:

| Name | Value |
|------|-------|
| `GROQ_API_KEY` | Your Groq API key (gsk_...) |
| `GEMINI_API_KEY` | Your Gemini API key (AIza...) |

---

## Part 2: Set Up GitHub Actions

### Step 1: Verify Workflow File

The workflow file is already created at `.github/workflows/daily-scrape.yml`

This workflow:
- ✅ Runs daily at 6:00 AM IST (12:30 AM UTC)
- ✅ Can be manually triggered from GitHub UI
- ✅ Scrapes RSS feeds
- ✅ Processes with 3-layer AI pipeline
- ✅ Auto-approves AI-relevant articles
- ✅ Commits updated database back to repo

### Step 2: Initial Database Setup

The workflow needs an initial database. Let's commit your current one:

```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker

# Add the database
git add backend/tracker.db

# Commit
git commit -m "Add initial production database

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push
git push origin main
```

### Step 3: Test the Workflow

1. Go to your repo: https://github.com/sreenathgov/india-ai-tracker
2. Click **Actions** tab
3. Click **Daily AI Tracker Scrape** workflow
4. Click **Run workflow** → **Run workflow**
5. Watch it run (takes 3-7 minutes)
6. Check the logs to see if it succeeds

**Expected result:**
- Workflow completes successfully
- New commit appears with updated database
- Summary shows articles scraped and processed

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with **GitHub** (easiest)
3. Authorize Vercel to access your repositories

### Step 2: Import Project

1. From Vercel dashboard, click **Add New...** → **Project**
2. Find and select **india-ai-tracker** repository
3. Click **Import**

### Step 3: Configure Project

**Framework Preset:** Other (it's static HTML)

**Root Directory:** Leave as `.` (root)

**Build & Development Settings:**
- Build Command: Leave empty (no build needed)
- Output Directory: `.` (serves from root)
- Install Command: Leave empty

**Environment Variables:** None needed for frontend

Click **Deploy**

### Step 4: Wait for Deployment

- First deployment takes 1-2 minutes
- Vercel will show you the deployment URL
- Example: `https://india-ai-tracker.vercel.app`

### Step 5: Test Deployed Site

1. Visit your Vercel URL
2. Check that the map loads
3. Click states to see data
4. Switch to "All India" view
5. Verify updates appear correctly

---

## Part 4: Configure Custom Domain

### Step 1: Add Domain in Vercel

1. In Vercel project, go to **Settings** → **Domains**
2. Enter your domain (e.g., `indiaaitracker.com`)
3. Click **Add**

### Step 2: Get Vercel DNS Records

Vercel will show you DNS records to add:

**For root domain (indiaaitracker.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

**For www subdomain (www.indiaaitracker.com):**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

### Step 3: Update NameCheap DNS

1. Log in to NameCheap
2. Go to **Domain List** → Click **Manage** next to your domain
3. Go to **Advanced DNS** tab
4. Add the DNS records from Vercel:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| CNAME Record | www | cname.vercel-dns.com | Automatic |

5. Click **Save all changes**

### Step 4: Wait for DNS Propagation

- DNS changes take 5-30 minutes
- Vercel will automatically verify and issue SSL certificate
- Once verified, your site will be live at your custom domain!

---

## Part 5: Update API URL in Frontend

Currently, the frontend points to `localhost:5001`. We need to change this to serve data from GitHub.

**Option A: Serve Database via GitHub Pages (Recommended for now)**

Update `js/app-final.js`:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:5001/api';

// To this:
const API_BASE_URL = '/api';
```

Then create an API directory structure to serve the database as JSON:

```bash
# This requires generating static JSON files from database
# We'll set this up in the next step
```

**Option B: Deploy Backend as Serverless Functions**

This is more complex and we can tackle it if needed. For now, let's use static JSON files.

---

## Part 6: Generate Static API Files

We need to convert the database to static JSON files that can be served directly.

Let me create a script for this:

```python
# backend/scripts/generate_static_api.py
# This will export database to JSON files
```

I'll create this script next if you want to proceed with static JSON approach.

---

## Maintenance & Monitoring

### Daily Automated Process

Once set up, the system runs automatically:

1. **6:00 AM IST** - GitHub Actions triggers
2. **Scraping** - Collects articles from RSS feeds (1-2 min)
3. **Processing** - 3-layer AI pipeline (2-5 min)
4. **Database Update** - Commits new data to repo
5. **Vercel Deploy** - Auto-deploys updated frontend (1-2 min)
6. **Live** - Changes appear on your domain

### Manual Triggers

You can manually trigger scraping:
1. Go to GitHub repo → **Actions** tab
2. Select **Daily AI Tracker Scrape**
3. Click **Run workflow**

### Monitoring

**GitHub Actions:**
- View workflow runs in **Actions** tab
- Check logs if anything fails
- Email notifications for failures

**Vercel:**
- Deployment logs in Vercel dashboard
- Automatic rollback if deployment fails
- Built-in analytics

---

## Troubleshooting

### GitHub Actions Fails

**Check API keys:**
- Go to Settings → Secrets and variables → Actions
- Verify `GROQ_API_KEY` and `GEMINI_API_KEY` are set

**Check logs:**
- Click on failed workflow run
- Expand failed step
- Look for error message

### Vercel Deployment Fails

**Check build logs:**
- In Vercel dashboard, click failed deployment
- View build logs for errors

**Common issues:**
- Missing files (check all assets are committed)
- Incorrect paths (verify relative paths)

### Domain Not Working

**Check DNS:**
```bash
# Check if DNS is propagated
dig indiaaitracker.com

# Should show Vercel's IP: 76.76.21.21
```

**Wait longer:**
- DNS can take up to 48 hours (usually faster)
- Use https://dnschecker.org to check propagation

---

## Cost Estimate

| Service | Tier | Cost |
|---------|------|------|
| GitHub Actions | Free tier | $0 (2,000 minutes/month free) |
| Groq API | Free tier | $0 (daily usage within limits) |
| Gemini API | Free tier | $0 (daily usage within limits) |
| Vercel Hosting | Hobby (free) | $0 |
| NameCheap Domain | Purchased | ~$10-15/year |

**Total Monthly Cost: $0** (just domain renewal yearly)

---

## Next Steps

1. ✅ Configure GitHub Secrets (API keys)
2. ✅ Commit initial database
3. ✅ Test GitHub Actions workflow
4. ✅ Deploy to Vercel
5. ✅ Configure custom domain
6. ⏳ Set up static JSON API (if needed)
7. ✅ Verify everything works end-to-end

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Verify all secrets are configured correctly

The system is designed to be low-maintenance once set up. The only ongoing task is monitoring the daily runs to ensure they complete successfully.
