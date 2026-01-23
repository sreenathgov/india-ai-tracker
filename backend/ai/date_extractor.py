"""
Date Extractor - Robust date parsing for Indian news articles

Handles:
- Standard formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
- Indian formats: 15th January 2025, January 15, 2025
- Relative dates: yesterday, 2 days ago, last week
- Hindi/regional month names
"""

import re
from datetime import datetime, timedelta
from typing import Optional


class DateExtractor:
    """Extract and normalize publication dates from article content."""

    # Month name mappings (English + common variations)
    MONTHS = {
        'january': 1, 'jan': 1,
        'february': 2, 'feb': 2,
        'march': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'may': 5,
        'june': 6, 'jun': 6,
        'july': 7, 'jul': 7,
        'august': 8, 'aug': 8,
        'september': 9, 'sep': 9, 'sept': 9,
        'october': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'december': 12, 'dec': 12,
    }

    # Patterns for various date formats
    DATE_PATTERNS = [
        # ISO format: 2025-01-15
        (r'(\d{4})-(\d{1,2})-(\d{1,2})', 'ymd'),

        # DD/MM/YYYY or DD-MM-YYYY (Indian format)
        (r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})', 'dmy'),

        # MM/DD/YYYY (US format - less common in India)
        (r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})', 'mdy'),

        # 15th January 2025, 15 January 2025
        (r'(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})', 'dMy'),

        # January 15, 2025 or January 15th, 2025
        (r'([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})', 'Mdy'),

        # 15 Jan 2025
        (r'(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})', 'dMy'),

        # Jan 15, 2025
        (r'([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})', 'Mdy'),

        # 15-Jan-2025
        (r'(\d{1,2})-([A-Za-z]{3,9})-(\d{4})', 'dMy'),
    ]

    # Relative date patterns
    RELATIVE_PATTERNS = [
        (r'\btoday\b', 0),
        (r'\byesterday\b', 1),
        (r'(\d+)\s+days?\s+ago\b', None),  # Dynamic
        (r'\blast\s+week\b', 7),
        (r'(\d+)\s+weeks?\s+ago\b', None),  # Dynamic
        (r'\ban?\s+hour\s+ago\b', 0),
        (r'(\d+)\s+hours?\s+ago\b', 0),
        (r'(\d+)\s+minutes?\s+ago\b', 0),
        (r'\bjust\s+now\b', 0),
    ]

    def __init__(self):
        self.compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE), fmt)
            for pattern, fmt in self.DATE_PATTERNS
        ]
        self.compiled_relative = [
            (re.compile(pattern, re.IGNORECASE), days)
            for pattern, days in self.RELATIVE_PATTERNS
        ]

    def extract(self, text: str, fallback_date: Optional[datetime] = None) -> Optional[datetime]:
        """
        Extract date from text.

        Args:
            text: Article content or metadata containing date
            fallback_date: Date to use if extraction fails

        Returns:
            datetime object or None
        """
        if not text:
            return fallback_date

        # Try relative dates first (most specific)
        relative_date = self._extract_relative(text)
        if relative_date:
            return relative_date

        # Try absolute date patterns
        absolute_date = self._extract_absolute(text)
        if absolute_date:
            return absolute_date

        return fallback_date

    def _extract_relative(self, text: str) -> Optional[datetime]:
        """Extract relative dates like 'yesterday', '2 days ago'."""
        today = datetime.now()

        for pattern, days in self.compiled_relative:
            match = pattern.search(text)
            if match:
                if days is not None:
                    return (today - timedelta(days=days)).date()
                else:
                    # Dynamic calculation from match groups
                    groups = match.groups()
                    if groups:
                        num = int(groups[0])
                        if 'week' in match.group().lower():
                            return (today - timedelta(weeks=num)).date()
                        else:
                            return (today - timedelta(days=num)).date()

        return None

    def _extract_absolute(self, text: str) -> Optional[datetime]:
        """Extract absolute dates in various formats."""
        for pattern, fmt in self.compiled_patterns:
            match = pattern.search(text)
            if match:
                try:
                    date = self._parse_match(match, fmt)
                    if date and self._is_valid_date(date):
                        return date
                except (ValueError, KeyError):
                    continue

        return None

    def _parse_match(self, match, fmt: str) -> Optional[datetime]:
        """Parse regex match based on format type."""
        groups = match.groups()

        if fmt == 'ymd':
            year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
        elif fmt == 'dmy':
            day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
        elif fmt == 'mdy':
            month, day, year = int(groups[0]), int(groups[1]), int(groups[2])
            # Heuristic: if month > 12, it's probably dmy format
            if month > 12:
                day, month = month, day
        elif fmt == 'dMy':
            day = int(groups[0])
            month = self._month_to_num(groups[1])
            year = int(groups[2])
        elif fmt == 'Mdy':
            month = self._month_to_num(groups[0])
            day = int(groups[1])
            year = int(groups[2])
        else:
            return None

        if month is None or month < 1 or month > 12:
            return None
        if day < 1 or day > 31:
            return None

        try:
            return datetime(year, month, day).date()
        except ValueError:
            return None

    def _month_to_num(self, month_str: str) -> Optional[int]:
        """Convert month name to number."""
        return self.MONTHS.get(month_str.lower().strip())

    def _is_valid_date(self, date) -> bool:
        """Check if date is reasonable (not too far in past or future)."""
        if date is None:
            return False

        today = datetime.now().date()

        # Accept dates within last 2 years and up to 1 month in future
        min_date = today - timedelta(days=730)  # 2 years ago
        max_date = today + timedelta(days=30)   # 1 month ahead

        return min_date <= date <= max_date

    def extract_from_html_meta(self, html: str) -> Optional[datetime]:
        """
        Extract date from HTML meta tags.

        Looks for common meta tags used for publish dates.
        """
        meta_patterns = [
            r'<meta\s+property="article:published_time"\s+content="([^"]+)"',
            r'<meta\s+name="publish[_-]?date"\s+content="([^"]+)"',
            r'<meta\s+name="date"\s+content="([^"]+)"',
            r'<meta\s+property="og:updated_time"\s+content="([^"]+)"',
            r'<time[^>]*datetime="([^"]+)"',
            r'"datePublished":\s*"([^"]+)"',
            r'"dateModified":\s*"([^"]+)"',
        ]

        for pattern in meta_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                extracted = self.extract(date_str)
                if extracted:
                    return extracted

        return None
