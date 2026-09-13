"""Tests for signal_intake.fetch — adapted RSS-ingestion pattern.

No live network calls: requests.get is monkeypatched to return an
in-memory RSS document built for each test.
"""

from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

import pytest
import requests

from signal_intake import fetch


class FakeResponse:
    def __init__(self, content: bytes, status_code: int = 200):
        self.content = content
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} error")


def rss_document(items: list[str]) -> bytes:
    body = "\n".join(items)
    return f"""<?xml version="1.0"?>
<rss version="2.0"><channel><title>Test Feed</title>
{body}
</channel></rss>""".encode()


def item_xml(title: str, link: str, summary: str = "", pub_date: str | None = None) -> str:
    date_tag = f"<pubDate>{pub_date}</pubDate>" if pub_date else ""
    return f"""<item>
<title>{title}</title>
<link>{link}</link>
<description>{summary}</description>
{date_tag}
</item>"""


def rfc822(dt: datetime) -> str:
    return format_datetime(dt)


NOW = datetime.now(timezone.utc)
RECENT = rfc822(NOW - timedelta(hours=1))
OLD = rfc822(NOW - timedelta(hours=200))


class TestFetchEntries:
    @pytest.mark.unit
    def test_keeps_recent_filters_old(self, monkeypatch):
        doc = rss_document(
            [
                item_xml("Recent Item", "https://example.com/recent", "Recent summary", RECENT),
                item_xml("Old Item", "https://example.com/old", "Old summary", OLD),
            ]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed", time_window_hours=96)

        urls = [e["url"] for e in entries]
        assert "https://example.com/recent" in urls
        assert "https://example.com/old" not in urls

    @pytest.mark.unit
    def test_skips_items_without_title_or_link(self, monkeypatch):
        doc = rss_document(
            [
                item_xml("", "https://example.com/notitle", "x", RECENT),
                item_xml("No Link Item", "", "x", RECENT),
                item_xml("Good Item", "https://example.com/good", "x", RECENT),
            ]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert len(entries) == 1
        assert entries[0]["url"] == "https://example.com/good"

    @pytest.mark.unit
    def test_keeps_items_with_no_date_at_all(self, monkeypatch):
        doc = rss_document(
            [item_xml("No Date Item", "https://example.com/nodate", "x")]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert len(entries) == 1
        assert entries[0]["published_at"] is None

    @pytest.mark.unit
    def test_published_at_is_iso_format(self, monkeypatch):
        doc = rss_document(
            [item_xml("Recent Item", "https://example.com/recent", "x", RECENT)]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        # Should parse back cleanly as ISO 8601.
        datetime.fromisoformat(entries[0]["published_at"])

    @pytest.mark.unit
    def test_respects_custom_time_window(self, monkeypatch):
        borderline = rfc822(NOW - timedelta(hours=10))
        doc = rss_document(
            [item_xml("Borderline Item", "https://example.com/borderline", "x", borderline)]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        assert fetch.fetch_entries("https://example.com/feed", time_window_hours=96)
        assert not fetch.fetch_entries("https://example.com/feed", time_window_hours=5)

    @pytest.mark.unit
    def test_returns_empty_list_on_request_exception(self, monkeypatch):
        def raise_timeout(*a, **k):
            raise requests.Timeout("timed out")

        monkeypatch.setattr(fetch.requests, "get", raise_timeout)

        assert fetch.fetch_entries("https://example.com/feed") == []

    @pytest.mark.unit
    def test_returns_empty_list_on_http_error_status(self, monkeypatch):
        monkeypatch.setattr(
            fetch.requests, "get", lambda *a, **k: FakeResponse(b"", status_code=500)
        )

        assert fetch.fetch_entries("https://example.com/feed") == []

    @pytest.mark.unit
    def test_limits_to_max_entries(self, monkeypatch):
        items = [
            item_xml(f"Item {i}", f"https://example.com/{i}", "x", RECENT) for i in range(30)
        ]
        doc = rss_document(items)
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert len(entries) <= fetch.MAX_ENTRIES_PER_FEED


class TestStripsHtmlFromTitleAndSummary:
    """Real captured signals have shown up with raw HTML markup stuck in
    title/summary — a Drupal title-span wrapper, embedded figure/img
    markup, and paragraph-tag wrapping — which then pollutes downstream
    keyword matching. fetch_entries's own docstring promises a "normalized
    entry shape independent of feedparser internals"; that normalization
    must include stripping markup, not just whitespace."""

    @pytest.mark.unit
    def test_strips_drupal_title_span_wrapper(self, monkeypatch):
        title = (
            '<span class="field field--name-title field--type-string '
            'field--label-hidden" id="pageTitle">Ambassador Greer Joins '
            "the FT News Briefing Podcast</span>"
        )
        doc = rss_document(
            [item_xml(title, "https://example.com/a", "x", RECENT)]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert entries[0]["title"] == "Ambassador Greer Joins the FT News Briefing Podcast"

    @pytest.mark.unit
    def test_strips_figure_img_markup_from_summary(self, monkeypatch):
        summary = (
            '<figure><div><img src="https://imgproxy.divecdn.com/x.jpg">'
            "</div></figure>Supply chains face new bottlenecks this quarter."
        )
        doc = rss_document(
            [item_xml("Good Title", "https://example.com/b", summary, RECENT)]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert entries[0]["summary"] == "Supply chains face new bottlenecks this quarter."

    @pytest.mark.unit
    def test_strips_paragraph_tag_wrapper_from_summary(self, monkeypatch):
        summary = "<p>Clean prose already, just wrapped in a paragraph tag.</p>"
        doc = rss_document(
            [item_xml("Good Title", "https://example.com/c", summary, RECENT)]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert entries[0]["summary"] == "Clean prose already, just wrapped in a paragraph tag."

    @pytest.mark.unit
    def test_decodes_html_entities_after_stripping_tags(self, monkeypatch):
        title = "Greer&#8217;s briefing &amp; the department&#8217;s response"
        doc = rss_document(
            [item_xml(title, "https://example.com/d", "x", RECENT)]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert entries[0]["title"] == "Greer’s briefing & the department’s response"

    @pytest.mark.unit
    def test_plain_text_title_and_summary_are_unaffected(self, monkeypatch):
        doc = rss_document(
            [
                item_xml(
                    "India semiconductor manufacturing boost",
                    "https://example.com/e",
                    "India semiconductor manufacturing incentives announced for new chip plants.",
                    RECENT,
                )
            ]
        )
        monkeypatch.setattr(fetch.requests, "get", lambda *a, **k: FakeResponse(doc))

        entries = fetch.fetch_entries("https://example.com/feed")

        assert entries[0]["title"] == "India semiconductor manufacturing boost"
        assert (
            entries[0]["summary"]
            == "India semiconductor manufacturing incentives announced for new chip plants."
        )
