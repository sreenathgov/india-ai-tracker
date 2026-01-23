"""
AI Summarizer - Generates article summaries using Groq API
"""

import os
import re
from pathlib import Path
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
