# Scheduling Daily Scrapes at 10 AM IST

There are 3 ways to set up automatic daily scraping:

---

## Option 1: Python Scheduler (Simplest)

This keeps a Python process running that triggers scrapes at 10 AM IST.

```bash
# Install required package
pip3 install schedule

# Run the scheduler (keeps terminal open)
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
python3 scheduler.py
```

**Pros:** Simple, runs immediately
**Cons:** Stops if you close terminal or computer sleeps

---

## Option 2: macOS Cron (Recommended for Mac)

Add a cron job that runs at 10:00 AM IST (4:30 AM UTC) every day.

```bash
# Open crontab editor
crontab -e

# Add this line (adjust path if needed):
30 4 * * * cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend && /usr/bin/python3 -m scrapers.orchestrator >> /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend/logs/scraper.log 2>&1
```

Create the logs directory first:
```bash
mkdir -p /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend/logs
```

**Note:** `30 4 * * *` means 4:30 AM UTC = 10:00 AM IST
Adjust if your Mac is set to a different timezone.

**Pros:** Runs even if terminal is closed, robust
**Cons:** Requires Mac to be awake at that time

---

## Option 3: macOS launchd (Most Reliable for Mac)

Create a launch agent that macOS manages.

1. Create the plist file:
```bash
nano ~/Library/LaunchAgents/com.indiaaitracker.scraper.plist
```

2. Add this content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.indiaaitracker.scraper</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>-m</string>
        <string>scrapers.orchestrator</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/sreenathgovindarajan/Documents/india-ai-tracker/backend</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>10</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/sreenathgovindarajan/Documents/india-ai-tracker/backend/logs/scraper.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/sreenathgovindarajan/Documents/india-ai-tracker/backend/logs/scraper_error.log</string>
</dict>
</plist>
```

3. Load the agent:
```bash
mkdir -p /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend/logs
launchctl load ~/Library/LaunchAgents/com.indiaaitracker.scraper.plist
```

4. To unload later:
```bash
launchctl unload ~/Library/LaunchAgents/com.indiaaitracker.scraper.plist
```

**Pros:** Native to macOS, very reliable, can wake Mac from sleep
**Cons:** More complex setup

---

## Manual Run (Testing)

To run the scraper manually anytime:
```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
python3 -m scrapers.orchestrator
```

## Check Scraper Health

To test which scrapers are working:
```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
python3 test_scrapers.py
```
