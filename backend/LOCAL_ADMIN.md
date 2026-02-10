# Local Admin Tool - User Guide

Welcome to the India AI Tracker Local Admin Tool! This is a localhost-only web interface for managing your tracker data.

## What This Tool Does

- **View and edit articles** (URL, title, summary, category, geography)
- **Browse all sources** (RSS feeds and web scrapers)
- **See git status** (current commit, branch, pending changes)
- **Publish changes** with one click (backup → save → git commit & push)

## Prerequisites

Before you start:

1. **Git** installed and configured
2. **Python 3.9+** installed
3. **Repository cloned** to your Mac
4. **Git credentials cached** (SSH key or credential manager working)

## Starting the Admin Tool

### Step 1: Open Terminal

Navigate to the backend directory:

```bash
cd ~/Documents/india-ai-tracker/backend
```

### Step 2: Set Admin Password (Optional)

By default, the password is `admin`. To use a custom password:

```bash
export ADMIN_PASSWORD="your-secure-password"
```

### Step 3: Run the Admin Tool

```bash
python local_admin.py
```

You should see output like:

```
============================================================
India AI Tracker - Local Admin Tool
============================================================

Admin panel starting at: http://localhost:5002
Default password: admin

Repo root: /Users/sreenathgovindarajan/Documents/india-ai-tracker
Articles loaded: 70
Sources loaded: 120

Press Ctrl+C to stop
```

### Step 4: Open in Browser

Open your browser and go to:

```
http://localhost:5002
```

Login with your admin password.

## Using the Admin Tool

### Dashboard

The dashboard shows you:

- **Git Status**: Current branch, last commit hash and message
- **Article Statistics**: Total articles, breakdown by category and state
- **Pending Changes**: Number of unsaved edits

From here you can:
- Click "Save & Publish" to commit and push all changes
- Click "Preview (Dry Run)" to see what would be committed without actually doing it
- Click "Discard" to throw away all pending changes

### Managing Articles

1. Click **"Updates"** in the navigation
2. Use the **search bar** to find articles by title, URL, or summary
3. Use **filters** to narrow by category or geography
4. Click **"Edit"** on any article to modify it

**When editing an article:**
- Change the **title** (required)
- Update the **summary**
- Change the **category** (Policy, Research, Business, etc.)
- Switch between **National** or **State-specific**
- Click **"Save Changes"**

⚠️ **Important:** Changes are saved in memory only! You must click "Save & Publish" on the Dashboard to write them to disk.

### Managing Sources

1. Click **"Sources"** in the navigation
2. View all RSS feeds and web scrapers
3. See which are active/disabled
4. See scope (National vs State-specific)

> **Note:** Full source editing is coming soon. For now, sources are view-only.

### Publishing Changes

Once you've made edits:

1. Go back to **Dashboard**
2. Review the **Pending Changes** section
3. Choose one:
   - **"Save & Publish"** - Commits and pushes to GitHub immediately
   - **"Preview (Dry Run)"** - Shows what would be committed without actually doing it
   - **"Discard"** - Throws away all pending changes

**What happens when you publish:**

1. ✅ **Backup created** - All current JSON files copied to `api/backups/YYYY-MM-DD_HH-MM-SS/`
2. ✅ **Changes written** - Updated JSON files saved to disk
3. ✅ **Git commit** - Changes committed with message like "Admin edit: 3 article updates"
4. ✅ **Git push** - Pushed to GitHub main branch
5. ✅ **Vercel deploy** - Site automatically redeploys in ~30 seconds

## Where Things Are Stored

- **Article data**: `api/all-india/categories.json`, `api/states/{STATE}/categories.json`
- **Source config**: `backend/sources.json`
- **Backups**: `api/backups/YYYY-MM-DD_HH-MM-SS/`
- **Logs**: Console output shows all operations

## Safety Features

### Automatic Backups

Before any write operation, the tool creates a timestamped backup of all data files. You can find these in:

```
api/backups/2026-02-03_14-30-25/
├── all-india_categories.json
├── states/
│   ├── TN_categories.json
│   ├── KA_categories.json
│   └── ...
└── sources.json
```

The tool keeps the last 10 backups and automatically deletes older ones.

### Validation

Before publishing, the tool validates:
- ✅ All required fields are present
- ✅ Categories are valid
- ✅ State codes are valid
- ✅ URLs are properly formatted

If validation fails, you'll see error messages and can fix the issues before trying again.

### Dry Run Mode

Use "Preview (Dry Run)" to see exactly what would be committed **without actually committing**. This is useful for:
- Checking you're editing the right files
- Verifying the commit message
- Making sure you haven't accidentally changed too much

## Troubleshooting

### Can't Push to GitHub

**Error:** "Push rejected" or "Authentication failed"

**Solution:**
1. Make sure git credentials are configured: `git config --global user.email "you@example.com"`
2. Test push manually: `cd ~/Documents/india-ai-tracker && git push`
3. If using SSH, ensure your key is added: `ssh-add ~/.ssh/id_rsa`
4. If using HTTPS, ensure credentials are cached

### Changes Not Appearing on Site

**Issue:** Clicked "Publish" but site still shows old data

**Solution:**
1. Check Vercel deployment status at https://vercel.com
2. Wait 30-60 seconds - deploys aren't instant
3. Hard refresh your browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Check the commit actually pushed: `git log -1` in terminal

### Lost Uncommitted Changes

**Issue:** Accidentally closed the tool before publishing

**Solution:**
1. All pending changes are lost when you close the tool (they were in memory only)
2. However, backups are created **before** any write operation
3. Check `api/backups/` for recent backups
4. Manually restore from the most recent backup if needed

### Tool Won't Start

**Error:** "Address already in use" or "Port 5002 is already in use"

**Solution:**
1. Another instance is already running - close it first
2. Or another app is using port 5002
3. Change the port in `local_admin.py` (line with `app.run(... port=5002 ...)`)

### Data Not Loading

**Error:** "Loaded 0 articles"

**Solution:**
1. Make sure you're in the `backend/` directory when running the tool
2. Check that `api/all-india/categories.json` exists
3. Pull latest changes: `git pull`

## Best Practices

### Before You Start

1. **Pull latest changes:** `git pull` in the repo directory
2. **Check git status:** Make sure you have no uncommitted changes
3. **Verify on dashboard:** Confirm the commit hash matches GitHub

### While Editing

1. **Make small, focused edits:** Easier to review and rollback if needed
2. **Use descriptive titles:** Help yourself find articles later
3. **Test with dry run first:** Preview before publishing

### After Publishing

1. **Wait for Vercel:** Give it 30-60 seconds to deploy
2. **Check the live site:** Verify your changes appear correctly
3. **Keep backups:** Don't delete the `api/backups/` directory

## Security Notes

🔒 **This tool is localhost-only**
- Only accessible from your Mac (127.0.0.1)
- Not exposed to the internet
- No remote access possible

🔑 **Password Protection**
- Simple password check (from environment variable)
- Session expires after inactivity
- Consider using a strong custom password

⚠️ **Git Credentials**
- The tool uses YOUR git credentials
- Make sure you're comfortable with automated commits
- Commits are attributed to you

## Getting Help

If you encounter issues:

1. Check this documentation first
2. Look at console output for error messages
3. Check `api/backups/` for data recovery
4. Review git history: `git log` to see what was committed

## Keyboard Shortcuts

While in the admin tool:

- `Ctrl+C` in terminal - Stop the admin tool
- `Cmd+R` in browser - Refresh the page
- `Cmd+Shift+R` - Hard refresh (clears cache)

## Stopping the Admin Tool

To stop the tool:

1. Go to the Terminal where it's running
2. Press `Ctrl+C`
3. You'll see: "Keyboard interrupt received, exiting"

All pending changes will be lost. Make sure you've published or discarded them first!

---

**Need to make changes while the public site continues to work?** That's the whole point! The admin tool edits your local files, and only when you click "Save & Publish" do those changes go live. Until then, the public site (kananlabs.in) continues showing the existing data.

**Happy editing! 🎉**
