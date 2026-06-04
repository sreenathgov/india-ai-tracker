"""
Server-side content hygiene for the canonical JSON store.

This is the backend half of a defense-in-depth fix for stored XSS. LLM-generated
article text (titles, summaries) and scraped URLs can contain executable markup
or unsafe URL schemes. The frontend escape-on-output layer is the authoritative
XSS defense; this module keeps the *canonical store itself* free of dangerous
markup and unsafe URLs, so the committed JSON never becomes a payload repository.

Design goals:
- Conservative: must NOT mangle legitimate prose such as "margin was < 5%".
- Idempotent: re-running on already-clean text is a no-op (the merge pipeline
  re-writes historical articles every run, so this runs repeatedly).
- Dependency-free: no new third-party packages (bleach, etc.) in this phase.
- Immutable: sanitize_article returns a new dict and never mutates its input.
"""

import re
from typing import Any

# Matches an actual HTML tag: "<" or "</" immediately followed by a tag-name
# letter. The required letter after "<" means "a < b" and "< 5%" are NOT treated
# as tags, preserving legitimate comparison/math prose.
_HTML_TAG_RE = re.compile(r"</?[a-zA-Z][^>]*>")

# HTML comments (which can hide payloads / conditional comments).
_HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)

# Dangerous URL schemes, tolerant of whitespace/control-char obfuscation inserted
# between characters (e.g. "java\tscript:"). We collapse internal whitespace in a
# scheme-shaped prefix before matching.
_DANGEROUS_SCHEME_RE = re.compile(
    r"(?i)\b(?:javascript|vbscript|data|file)\s*:"
)

# Disallowed control characters (keep \t, \n, \r which are legitimate whitespace).
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Schemes permitted in the URL (href) field. Protocol-relative and site-relative
# URLs are also allowed (see sanitize_url).
_ALLOWED_URL_SCHEME_RE = re.compile(r"(?i)^https?://")


def sanitize_text(value: Any) -> str:
    """Strip dangerous HTML from a free-text field, preserving plain prose.

    Removes HTML tags, HTML comments, dangerous URL schemes embedded in text,
    and control characters. Conservative by design: comparison text like
    "< 5%" is preserved because a tag requires a letter immediately after "<".

    Args:
        value: The raw text (may be None or a non-string).

    Returns:
        A cleaned plain-text string (never None).
    """
    if value is None:
        return ""
    text = value if isinstance(value, str) else str(value)

    text = _HTML_COMMENT_RE.sub("", text)
    text = _HTML_TAG_RE.sub("", text)
    text = _DANGEROUS_SCHEME_RE.sub("", text)
    text = _CONTROL_CHARS_RE.sub("", text)

    return text.strip()


def sanitize_url(value: Any) -> str:
    """Enforce an http(s)-only allowlist for a URL field.

    Blocks javascript:, data:, vbscript:, file: and any other non-http(s)
    scheme. Tolerates whitespace/control-char obfuscation inside the scheme.

    Args:
        value: The raw URL (may be None or a non-string).

    Returns:
        The trimmed URL if it is a safe http(s) URL, otherwise an empty string.
    """
    if value is None:
        return ""
    url = (value if isinstance(value, str) else str(value)).strip()
    if not url:
        return ""

    # Strip control chars and collapse internal whitespace so obfuscated schemes
    # like "java\tscript:" are caught by the dangerous-scheme check.
    collapsed = _CONTROL_CHARS_RE.sub("", url)
    collapsed = re.sub(r"\s+", "", collapsed)

    if _DANGEROUS_SCHEME_RE.search(collapsed):
        return ""
    if not _ALLOWED_URL_SCHEME_RE.match(collapsed):
        return ""

    return url


# Article fields treated as free text vs. as a URL.
_TEXT_FIELDS = ("title", "summary")
_URL_FIELDS = ("url",)


def sanitize_article(article: dict) -> dict:
    """Return a new article dict with text/URL fields sanitized.

    Does not mutate the input (immutability rule). Unrelated fields are copied
    through unchanged.

    Args:
        article: An article dictionary (as stored in the canonical JSON).

    Returns:
        A new dict with sanitized 'title', 'summary', and 'url' where present.
    """
    cleaned = dict(article)
    for field in _TEXT_FIELDS:
        if field in cleaned:
            cleaned[field] = sanitize_text(cleaned[field])
    for field in _URL_FIELDS:
        if field in cleaned:
            cleaned[field] = sanitize_url(cleaned[field])
    return cleaned
