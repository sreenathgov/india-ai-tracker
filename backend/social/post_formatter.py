"""
Post Formatter for X (Twitter)

Formats articles into tweet-ready text with:
- Category emoji
- State/National label
- Concise summary
- Link to article

Handles character limits (280 chars) gracefully.
"""

import re
from typing import Dict, Any, Optional, List
import json


class PostFormatter:
    """
    Formats articles into tweets for X posting.

    Tweet format:
    [emoji] [State or "India-wide"] - [summary] [link]

    Example:
    🚀 Karnataka - KPMG launches new AI innovation hub in Bengaluru https://indiaai.example.com/article/123
    """

    # Character limit for X posts (tweets)
    MAX_CHARS = 280

    # URLs count as 23 characters on X regardless of actual length
    URL_CHAR_COUNT = 23

    # Category to emoji mapping
    CATEGORY_EMOJIS = {
        'Policies and Initiatives': '📜',
        'Events': '📅',
        'Major AI Developments': '🚀',
        'AI Start-Up News': '💡',
        # Fallback for any other category
        'default': '🤖'
    }

    # State code to display name mapping (common ones)
    STATE_NAMES = {
        'IN': 'India-wide',
        'AN': 'Andaman & Nicobar',
        'AP': 'Andhra Pradesh',
        'AR': 'Arunachal Pradesh',
        'AS': 'Assam',
        'BR': 'Bihar',
        'CH': 'Chandigarh',
        'CT': 'Chhattisgarh',
        'DD': 'Daman & Diu',
        'DL': 'Delhi',
        'GA': 'Goa',
        'GJ': 'Gujarat',
        'HP': 'Himachal Pradesh',
        'HR': 'Haryana',
        'JH': 'Jharkhand',
        'JK': 'Jammu & Kashmir',
        'KA': 'Karnataka',
        'KL': 'Kerala',
        'LA': 'Ladakh',
        'LD': 'Lakshadweep',
        'MH': 'Maharashtra',
        'ML': 'Meghalaya',
        'MN': 'Manipur',
        'MP': 'Madhya Pradesh',
        'MZ': 'Mizoram',
        'NL': 'Nagaland',
        'OD': 'Odisha',
        'PB': 'Punjab',
        'PY': 'Puducherry',
        'RJ': 'Rajasthan',
        'SK': 'Sikkim',
        'TG': 'Telangana',
        'TN': 'Tamil Nadu',
        'TR': 'Tripura',
        'UK': 'Uttarakhand',
        'UP': 'Uttar Pradesh',
        'WB': 'West Bengal'
    }

    def __init__(self, base_url: str = "https://kananlabs.in"):
        """
        Initialize the formatter.

        Args:
            base_url: Base URL for article links (default: production site)
        """
        self.base_url = base_url.rstrip('/')

    def get_emoji(self, category: str) -> str:
        """Get emoji for a category."""
        return self.CATEGORY_EMOJIS.get(category, self.CATEGORY_EMOJIS['default'])

    def get_state_label(self, state_codes: List[str]) -> str:
        """
        Get a display label for the state(s).

        Rules:
        - If 'IN' is present (national scope), use 'India-wide'
        - If single state, use state name
        - If multiple states, use first state name
        """
        if not state_codes:
            return 'India-wide'

        # Check for national scope
        if 'IN' in state_codes:
            return 'India-wide'

        # Get first non-IN state
        for code in state_codes:
            if code != 'IN' and code in self.STATE_NAMES:
                return self.STATE_NAMES[code]

        # Fallback
        return 'India-wide'

    def truncate_summary(self, summary: str, max_length: int) -> str:
        """
        Truncate summary to fit within max_length, preserving whole words.

        Adds '...' if truncated.
        """
        if not summary or len(summary) <= max_length:
            return summary or ''

        # Find last space before max_length - 3 (for '...')
        truncated = summary[:max_length - 3]
        last_space = truncated.rfind(' ')

        if last_space > max_length // 2:
            truncated = truncated[:last_space]

        return truncated.rstrip('.,;:') + '...'

    def clean_summary(self, summary: str) -> str:
        """
        Clean up summary text for tweet.

        - Remove extra whitespace
        - Remove multiple periods
        - Ensure single sentence if possible
        """
        if not summary:
            return ''

        # Normalize whitespace
        text = ' '.join(summary.split())

        # Take first sentence if multiple
        sentences = re.split(r'(?<=[.!?])\s+', text)
        if sentences:
            text = sentences[0]

        # Remove trailing punctuation except period
        text = text.rstrip(',;:')

        return text

    def format_article(
        self,
        article: Dict[str, Any],
        include_link: bool = True
    ) -> Dict[str, Any]:
        """
        Format an article into a tweet.

        Args:
            article: Article dict with 'id', 'title', 'summary', 'category', 'state_codes'
            include_link: Whether to include the article link

        Returns:
            Dict with 'text', 'char_count', 'article_id', and 'truncated' keys
        """
        # Extract article data
        article_id = article.get('id')
        category = article.get('category', '')
        summary = article.get('summary') or article.get('title', '')
        state_codes = article.get('state_codes', [])

        # Handle state_codes if it's a JSON string
        if isinstance(state_codes, str):
            try:
                state_codes = json.loads(state_codes)
            except (json.JSONDecodeError, TypeError):
                state_codes = []

        # Build components
        emoji = self.get_emoji(category)
        state_label = self.get_state_label(state_codes)

        # Build link
        link = f"{self.base_url}/#article-{article_id}" if include_link else ""

        # Calculate available space for summary
        # Format: "[emoji] [state] - [summary] [link]"
        prefix = f"{emoji} {state_label} - "
        prefix_len = len(prefix)

        if include_link:
            # URLs always count as 23 chars on X
            available_for_summary = self.MAX_CHARS - prefix_len - self.URL_CHAR_COUNT - 1  # -1 for space before link
        else:
            available_for_summary = self.MAX_CHARS - prefix_len

        # Clean and truncate summary
        clean_text = self.clean_summary(summary)
        truncated_summary = self.truncate_summary(clean_text, available_for_summary)
        was_truncated = len(clean_text) > available_for_summary

        # Build final tweet
        if include_link:
            tweet_text = f"{prefix}{truncated_summary} {link}"
        else:
            tweet_text = f"{prefix}{truncated_summary}"

        return {
            'text': tweet_text,
            'char_count': len(prefix) + len(truncated_summary) + (self.URL_CHAR_COUNT + 1 if include_link else 0),
            'article_id': article_id,
            'truncated': was_truncated,
            'category': category,
            'state_label': state_label
        }

    def format_articles(
        self,
        articles: List[Dict[str, Any]],
        include_links: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Format multiple articles into tweets.

        Args:
            articles: List of article dicts
            include_links: Whether to include article links

        Returns:
            List of formatted tweet dicts
        """
        return [
            self.format_article(article, include_link=include_links)
            for article in articles
        ]


def create_formatter(base_url: Optional[str] = None) -> PostFormatter:
    """Factory function to create a PostFormatter."""
    if base_url:
        return PostFormatter(base_url=base_url)
    return PostFormatter()
