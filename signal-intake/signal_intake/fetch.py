"""RSS/Atom feed fetching, adapted from the ingestion pattern in
backend/scrapers/rss_scraper.py (not imported — this module has no
dependency on backend/).

Returns a normalized entry shape independent of feedparser internals:
{"title": str, "url": str, "summary": str, "published_at": str | None}
"""

import logging
from datetime import datetime, timedelta, timezone

import feedparser
import requests

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; KananLabs-SignalIntake/1.0)"
DEFAULT_TIMEOUT_SECONDS = 15
DEFAULT_TIME_WINDOW_HOURS = 96
MAX_ENTRIES_PER_FEED = 20


def fetch_entries(
    url: str,
    *,
    time_window_hours: int = DEFAULT_TIME_WINDOW_HOURS,
    timeout: int = DEFAULT_TIMEOUT_SECONDS,
) -> list[dict[str, str | None]]:
    """Fetch and time-window-filter entries from an RSS/Atom feed.

    Items with no parseable publish date are always kept (consistent with
    the existing tracker's scraper: an absent date should not silently
    drop an item). Returns [] on any fetch/parse-level failure — logged,
    not raised, so one dead feed doesn't halt a run over many sources.
    """
    try:
        response = requests.get(
            url, timeout=timeout, headers={"User-Agent": DEFAULT_USER_AGENT}
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.error("Failed to fetch feed %s: %s", url, exc)
        return []

    feed = feedparser.parse(response.content)
    if feed.bozo and not feed.entries:
        logger.warning(
            "Feed %s parsed with errors and yielded no entries: %s",
            url,
            getattr(feed, "bozo_exception", "unknown error"),
        )
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)
    entries: list[dict[str, str | None]] = []

    for raw_entry in feed.entries[:MAX_ENTRIES_PER_FEED]:
        title = (raw_entry.get("title") or "").strip()
        link = (raw_entry.get("link") or "").strip()
        if not title or not link:
            continue

        published_dt = _extract_published_dt(raw_entry)
        if published_dt is not None and published_dt < cutoff:
            continue

        entries.append(
            {
                "title": title,
                "url": link,
                "summary": (raw_entry.get("summary") or "").strip(),
                "published_at": published_dt.isoformat() if published_dt else None,
            }
        )

    return entries


def _extract_published_dt(raw_entry) -> datetime | None:
    struct = raw_entry.get("published_parsed") or raw_entry.get("updated_parsed")
    if not struct:
        return None
    return datetime(*struct[:6], tzinfo=timezone.utc)
