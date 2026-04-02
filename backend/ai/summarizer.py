"""
AI Summarizer - Generates article summaries using Groq API
"""

import os
import re
from pathlib import Path
from typing import Tuple
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from groq import Groq


class AISummarizer:
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if api_key:
            self.client = Groq(api_key=api_key)
        else:
            print("  Warning: GROQ_API_KEY not found. Summaries will use fallback.")
            self.client = None

    def summarize(self, title, content):
        """Generate a 2-3 sentence summary of the article."""
        if not self.client:
            # Fallback: use first part of content as summary
            return self._fallback_summary(title, content)

        try:
            prompt = f"""Summarize this AI news article in 2-3 concise sentences. Focus on the key facts.

IMPORTANT: Output ONLY the summary text. Do not include any preamble like "Here is a summary" or "Summary:". Just write the summary directly.

Title: {title}
Content: {content[:800] if content else title}"""

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=150
            )
            summary = response.choices[0].message.content.strip()

            # Remove common preamble patterns if LLM still includes them
            summary = self._remove_preamble(summary)

            return summary

        except Exception as e:
            print(f"  Summarizer error: {e}")
            return self._fallback_summary(title, content)

    def _remove_preamble(self, summary):
        """Remove all known preamble patterns from summary."""
        # Patterns to remove (case-insensitive)
        preamble_patterns = [
            r"^here is a \d+-?\d* sentence summary of the article[:\s]*",
            r"^here is a \d+-?\d* sentence summary[:\s]*",
            r"^here is a summary of the article in \d+-?\d* (?:concise )?sentences?[:\s]*",
            r"^here is a summary of the article[:\s]*",
            r"^here is a summary[:\s]*",
            r"^here is the summary[:\s]*",
            r"^here's a (?:\d+-?\d* sentence )?summary[:\s]*",
            r"^summary of the article[:\s]*",
            r"^summary[:\s]*",
            r"^the article (?:discusses|describes|reports|explains)[:\s]*",
            r"^this article (?:discusses|describes|reports|explains)[:\s]*",
            r"^in summary[,:\s]*",
            r"^to summarize[,:\s]*",
        ]

        for pattern in preamble_patterns:
            summary = re.sub(pattern, '', summary, flags=re.IGNORECASE).strip()

        return summary

    def summarize_with_check(self, title: str, content: str) -> Tuple[str, bool]:
        """
        Generate a summary and check title-summary topical consistency.

        Returns:
            (summary, is_consistent) — is_consistent is False when the summary
            shares no significant keywords with the title, indicating the scraper
            likely fetched wrong or mixed page content.
        """
        summary = self.summarize(title, content)
        is_consistent = self._is_summary_consistent(title, summary)
        return summary, is_consistent

    def _is_summary_consistent(self, title: str, summary: str) -> bool:
        """
        Check that the summary shares at least one significant keyword with the title.

        Returns True (consistent) when the topics overlap, False when there is
        zero keyword overlap — a strong signal that the scraped body came from the
        wrong page or contained unrelated injected content.
        """
        _STOP_WORDS = {
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'and', 'but', 'or',
            'so', 'that', 'this', 'these', 'those', 'it', 'its', 'as', 'how',
            'what', 'when', 'where', 'who', 'which', 'of', 'in', 'to', 'for',
            'with', 'on', 'at', 'by', 'from', 'up', 'into', 'new', 'latest',
            'india', 'indian', 'says', 'said', 'also', 'over', 'about', 'more',
        }

        title_words = {
            w.lower() for w in re.findall(r'\b\w{4,}\b', title)
            if w.lower() not in _STOP_WORDS
        }
        if not title_words:
            return True  # Too short to judge; give benefit of the doubt

        summary_lower = summary.lower()
        return any(w in summary_lower for w in title_words)

    def _fallback_summary(self, title, content):
        """Create a basic summary without AI."""
        if content and len(content) > 50:
            # Use first 200 chars of content
            summary = content[:200].strip()
            if len(content) > 200:
                summary += "..."
            return summary
        else:
            return title
