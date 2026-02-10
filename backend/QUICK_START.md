# Quick Start Guide - Local Admin Tool

## 🚀 Start in 3 Steps

### 1. Open Terminal and Navigate to Backend

```bash
cd ~/Documents/india-ai-tracker/backend
```

### 2. Run the Admin Tool

```bash
python local_admin.py
```

You'll see:
```
============================================================
India AI Tracker - Local Admin Tool
============================================================

Admin panel starting at: http://localhost:5002
Default password: admin

Articles loaded: 234
Sources loaded: 35

Press Ctrl+C to stop
```

### 3. Open Browser

Go to: **http://localhost:5002**

Login with password: `admin`

---

## 🎯 What You Can Do

### ✅ View All Articles
- Click "Updates" tab
- Search by title/URL
- Filter by category or state
- See all 234 articles in your tracker

### ✏️ Edit Articles
- Click "Edit" on any article
- Change title, summary, category
- Switch between National/State-specific
- Click "Save Changes"

### 📊 See Statistics
- Dashboard shows counts by category
- Shows counts by state
- Displays git status and last commit

### 💾 Publish Changes
1. Make edits to articles
2. Go to Dashboard
3. Click "Save & Publish"
4. Tool will:
   - Create backup
   - Write to JSON files
   - Commit to git
   - Push to GitHub
   - Trigger Vercel deploy

### 🔍 Preview Before Publishing
- Click "Preview (Dry Run)" to see what would be committed
- No changes are made until you confirm

---

## 📁 Files Created

```
backend/
├── local_admin.py          ← Main entry point
├── admin/
│   ├── services/
│   │   ├── data_manager.py     ← JSON read/write + backups
│   │   └── git_manager.py      ← Git operations
│   ├── routes/              (Flask routes)
│   └── templates/           (HTML pages)
├── LOCAL_ADMIN.md          ← Full documentation
└── QUICK_START.md          ← This file
```

---

## ⚠️ Important Notes

1. **Localhost Only** - Not accessible from other machines (127.0.0.1)
2. **Changes in Memory** - Edits not saved until you click "Publish"
3. **Auto Backups** - Created before any write operation (`api/backups/`)
4. **Git Required** - Make sure git credentials are configured
5. **Pull First** - Run `git pull` before starting to get latest data

---

## 🛑 Stop the Tool

Press `Ctrl+C` in the Terminal window where it's running.

**Warning:** Any unpublished changes will be lost!

---

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Kill any process on port 5002
lsof -ti:5002 | xargs kill -9
```

**Can't load data?**
```bash
# Make sure you're in backend directory
pwd  # Should show: .../india-ai-tracker/backend
```

**Changes not showing on site?**
- Wait 30-60 seconds for Vercel to deploy
- Hard refresh browser: Cmd+Shift+R

---

## 📖 Full Documentation

See `LOCAL_ADMIN.md` for complete guide including:
- Security features
- Backup strategy
- Validation rules
- Best practices
- Detailed troubleshooting

---

**Happy editing! 🎉**

Your local admin tool is ready to use. Start it, login, and begin managing your India AI Tracker data with ease!
