"""
Unit tests for backend.utils.sanitize — the server-side hygiene layer that
strips dangerous HTML from LLM-generated article text and enforces an
http(s)-only URL allowlist before content is written to the canonical JSON store.

This is the backend half of the defense-in-depth fix for the stored-XSS vector
(LLM summary/title -> canonical JSON -> frontend innerHTML). The frontend
escape-on-output layer is the authoritative defense; this layer keeps the
canonical store free of executable markup and unsafe URL schemes.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.sanitize import sanitize_text, sanitize_url, sanitize_article


@pytest.mark.unit
class TestSanitizeText:
    def test_strips_script_tag(self):
        assert "<script" not in sanitize_text("Hello<script>alert(1)</script>")

    def test_strips_img_onerror_payload(self):
        cleaned = sanitize_text('<img src=x onerror="alert(1)">caption')
        assert "<img" not in cleaned
        assert "onerror" not in cleaned
        assert "caption" in cleaned

    def test_strips_event_handler_in_anchor(self):
        cleaned = sanitize_text('<a href="#" onclick="steal()">link</a>')
        assert "onclick" not in cleaned
        assert "<a" not in cleaned
        assert "link" in cleaned

    def test_preserves_math_less_than_with_space(self):
        # The conservative tag regex must NOT treat "< 5" as a tag.
        text = "Revenue grew when margin was < 5% and demand > 3%"
        assert sanitize_text(text) == text

    def test_preserves_plain_text_unchanged(self):
        text = "India's AI policy update for Karnataka"
        assert sanitize_text(text) == text

    def test_removes_javascript_scheme_in_text(self):
        cleaned = sanitize_text("click javascript:alert(1) now")
        assert "javascript:" not in cleaned.lower()

    def test_idempotent(self):
        once = sanitize_text("<script>x</script>Report < 5% growth")
        twice = sanitize_text(once)
        assert once == twice

    def test_handles_none(self):
        assert sanitize_text(None) == ""

    def test_handles_non_string(self):
        assert sanitize_text(12345) == "12345"

    def test_strips_control_characters(self):
        assert "\x00" not in sanitize_text("bad\x00text")


@pytest.mark.unit
class TestSanitizeUrl:
    def test_allows_https(self):
        url = "https://example.com/article?id=1"
        assert sanitize_url(url) == url

    def test_allows_http(self):
        url = "http://example.com/a"
        assert sanitize_url(url) == url

    def test_blocks_javascript_scheme(self):
        assert sanitize_url("javascript:alert(1)") == ""

    def test_blocks_data_scheme(self):
        assert sanitize_url("data:text/html,<script>alert(1)</script>") == ""

    def test_blocks_vbscript_scheme(self):
        assert sanitize_url("vbscript:msgbox(1)") == ""

    def test_blocks_scheme_with_whitespace_obfuscation(self):
        assert sanitize_url("  java\tscript:alert(1)") == ""

    def test_handles_none(self):
        assert sanitize_url(None) == ""

    def test_strips_surrounding_whitespace(self):
        assert sanitize_url("  https://example.com  ") == "https://example.com"


@pytest.mark.unit
class TestSanitizeArticle:
    def test_returns_new_dict_without_mutating_input(self):
        original = {
            "title": "Clean title",
            "summary": "<script>alert(1)</script>summary",
            "url": "javascript:alert(1)",
            "category": "Events",
        }
        result = sanitize_article(original)
        # Input is not mutated (immutability rule).
        assert original["summary"] == "<script>alert(1)</script>summary"
        assert original["url"] == "javascript:alert(1)"
        # Output is cleaned.
        assert "<script" not in result["summary"]
        assert result["url"] == ""
        assert result is not original

    def test_preserves_unrelated_fields(self):
        original = {
            "title": "t",
            "summary": "s",
            "url": "https://example.com",
            "importance_score": 8.5,
            "state_codes": ["IN"],
        }
        result = sanitize_article(original)
        assert result["importance_score"] == 8.5
        assert result["state_codes"] == ["IN"]
        assert result["url"] == "https://example.com"

    def test_sanitizes_title_and_summary(self):
        result = sanitize_article(
            {"title": "<b>Hi</b>", "summary": "<img src=x onerror=alert(1)>txt"}
        )
        assert result["title"] == "Hi"
        assert "<img" not in result["summary"]
        assert "txt" in result["summary"]

    def test_handles_missing_text_fields(self):
        result = sanitize_article({"url": "https://example.com"})
        assert result["url"] == "https://example.com"
