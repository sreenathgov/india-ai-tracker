"""
Canonical key utilities for deduplication across the India AI Tracker system.

The canonical key is used to uniquely identify articles across different scrape runs
and prevent duplicates. We use normalized URLs as the primary identifier.
"""

from urllib.parse import urlparse, urlunparse


def normalize_url(url):
    """
    Normalize a URL for comparison and deduplication.

    Removes:
    - Query parameters
    - Fragments
    - Trailing slashes
    - Converts to lowercase

    Args:
        url: Original URL string

    Returns:
        Normalized URL string suitable for use as canonical key

    Example:
        >>> normalize_url("https://Example.com/Article?utm_source=twitter#section")
        'https://example.com/article'
    """
    if not url:
        return ""

    url = url.strip()
    parsed = urlparse(url.lower())

    # Reconstruct without query params and fragments
    normalized = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        '',  # params
        '',  # query
        ''   # fragment
    ))

    # Remove trailing slash for consistency
    return normalized.rstrip('/')


def get_canonical_key(article):
    """
    Generate a stable canonical key for an article.

    This key is used across the entire system for deduplication:
    - Global deduplication before AI processing
    - Merge logic when updating JSON API files
    - Cross-day duplicate detection

    Args:
        article: Dictionary with at minimum a 'url' field

    Returns:
        Canonical key string (normalized URL)

    Example:
        >>> article = {'url': 'https://Example.com/News?id=123', 'title': '...'}
        >>> get_canonical_key(article)
        'https://example.com/news'
    """
    url = article.get('url', '')
    return normalize_url(url)


def articles_are_same(article1, article2):
    """
    Check if two articles are the same based on canonical key.

    Args:
        article1: First article dictionary
        article2: Second article dictionary

    Returns:
        True if articles have the same canonical key, False otherwise
    """
    return get_canonical_key(article1) == get_canonical_key(article2)
