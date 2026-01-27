"""
Gemini API Wrapper for Batch Processing

This module provides a unified interface for processing articles with Google's Gemini API.
It supports batch processing (3 articles per API call) with all AI tasks combined.

Free Tier Limits:
- 1M tokens/minute
- 15 requests/minute (RPM)
- 1,500 requests/day (RPD)

Our Usage:
- ~700 API calls/day (well within limits)
- Batch size = 3 articles per call
- All AI tasks combined in single prompt
"""

import google.generativeai as genai
import os
import json
from typing import List, Dict, Any


class GeminiAPIError(Exception):
    """Custom exception for Gemini API errors"""
    pass


class GeminiProcessor:
    """
    Processes articles using Gemini API with batch support.

    Combines all AI tasks in a single prompt:
    - Relevance checking
    - Categorization
    - Geographic attribution
    - Summarization
    """

    def __init__(self, api_key: str = None):
        """
        Initialize Gemini API client.

        Args:
            api_key: Gemini API key (reads from env if not provided)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")

        # Configure Gemini
        genai.configure(api_key=self.api_key)

        # Use Gemini 2.5 Flash (free tier, fast, good quality)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

        # Categories for classification
        self.categories = [
            'Policies and Initiatives',
            'Events',
            'Major AI Developments',
            'AI Start-Up News'
        ]

        # Indian states for geographic attribution
        self.states = [
            'IN',  # All India/National
            'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DN', 'DD', 'DL', 'GA',
            'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LA', 'LD', 'MP', 'MH',
            'MN', 'ML', 'MZ', 'NL', 'OD', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TS',
            'TR', 'UP', 'UK', 'WB'
        ]

    def process_batch(self, articles: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Process a batch of articles (up to 3) with all AI tasks combined.

        Args:
            articles: List of dicts with 'title' and 'content' keys

        Returns:
            List of results, one per article:
            {
                'is_relevant': bool,
                'relevance_score': float (0-100),
                'category': str or None,
                'state_codes': list of str,
                'summary': str or None,
                'success': bool,
                'error': str (if failed)
            }
        """
        if not articles:
            return []

        if len(articles) > 3:
            raise ValueError("Batch size must be <= 3 articles")

        try:
            # Build combined prompt
            prompt = self._build_batch_prompt(articles)

            # Call Gemini API
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent output
                    max_output_tokens=2000,
                )
            )

            # Parse response
            results = self._parse_batch_response(response.text, len(articles))

            return results

        except Exception as e:
            # If batch fails, return error for all articles
            error_result = {
                'success': False,
                'error': str(e)
            }
            return [error_result.copy() for _ in articles]

    def _build_batch_prompt(self, articles: List[Dict[str, str]]) -> str:
        """
        Build a single prompt that processes multiple articles.

        Format:
        ARTICLE 1:
        Title: [title]
        Content: [content]

        ARTICLE 2:
        ...

        For each article, analyze...
        """
        prompt_parts = [
            "You are an AI article analyzer for the India AI Policy Tracker.",
            "",
            "Process these articles about AI developments in India:",
            ""
        ]

        # Add each article
        for i, article in enumerate(articles, 1):
            prompt_parts.extend([
                f"ARTICLE {i}:",
                f"Title: {article['title']}",
                f"Content: {article.get('content', '')[:1000]}",  # First 1000 chars
                ""
            ])

        # Add instructions
        prompt_parts.extend([
            "",
            "For EACH article, provide:",
            "",
            "1. **AI Relevance**: Is this article PRIMARILY about artificial intelligence/machine learning?",
            "   - Answer: YES or NO",
            "   - Score: 0-100 (confidence)",
            "   - Rules:",
            "     * Must be MAINLY about AI technology, products, policy, or applications",
            "     * General tech news is NO",
            "     * AI mentioned in passing is NO",
            "",
            "2. **Category** (ONLY if AI-relevant):",
            f"   - One of: {', '.join(self.categories)}",
            "   - Policies and Initiatives: Government policies, regulations, strategies",
            "   - Events: Conferences, summits, launches, announcements",
            "   - Major AI Developments: Research breakthroughs, infrastructure, partnerships",
            "   - AI Start-Up News: Funding, product launches, startup announcements",
            "",
            "3. **Geographic Attribution** (ONLY if AI-relevant):",
            "   - Which Indian state(s) is this about?",
            "   - Options: Use state code (TN, KA, MH, DL, etc.) or 'IN' for national/all-India",
            "   - Can be multiple states (e.g., [TN, KA])",
            "   - Default to 'IN' if unclear or national-level",
            "",
            "4. **Summary** (ONLY if AI-relevant):",
            "   - 2-3 sentences summarizing the key points",
            "   - Focus on what, who, when, and impact",
            "",
            "CRITICAL: Output ONLY valid JSON in this exact format:",
            "",
            "```json",
            "[",
            "  {",
            '    "article_number": 1,',
            '    "is_relevant": true,',
            '    "relevance_score": 85,',
            '    "category": "Major AI Developments",',
            '    "state_codes": ["KA"],',
            '    "summary": "Summary text here"',
            "  },",
            "  {",
            '    "article_number": 2,',
            '    "is_relevant": false,',
            '    "relevance_score": 30',
            "  }",
            "]",
            "```",
            "",
            "If article is NOT AI-relevant, only include: article_number, is_relevant, relevance_score",
            "NO explanation, NO markdown except the JSON block, NO extra text."
        ])

        return "\n".join(prompt_parts)

    def _parse_batch_response(self, response_text: str, expected_count: int) -> List[Dict[str, Any]]:
        """
        Parse Gemini's JSON response into structured results.

        Args:
            response_text: Raw response from Gemini
            expected_count: Number of articles in batch

        Returns:
            List of parsed results
        """
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_text = response_text.strip()

            # Remove markdown code blocks if present
            if json_text.startswith('```'):
                # Find the actual JSON content
                lines = json_text.split('\n')
                json_lines = []
                in_json = False

                for line in lines:
                    if line.strip().startswith('```'):
                        in_json = not in_json
                        continue
                    if in_json or (line.strip().startswith('[') or line.strip().startswith('{')):
                        json_lines.append(line)

                json_text = '\n'.join(json_lines)

            # Parse JSON
            parsed = json.loads(json_text)

            # Validate structure
            if not isinstance(parsed, list):
                raise ValueError("Response must be a JSON array")

            if len(parsed) != expected_count:
                raise ValueError(f"Expected {expected_count} results, got {len(parsed)}")

            # Convert to standard format
            results = []
            for item in parsed:
                result = {
                    'is_relevant': item.get('is_relevant', False),
                    'relevance_score': float(item.get('relevance_score', 0)),
                    'success': True
                }

                if result['is_relevant']:
                    result['category'] = item.get('category')
                    result['state_codes'] = item.get('state_codes', ['IN'])
                    result['summary'] = item.get('summary', '')

                results.append(result)

            return results

        except Exception as e:
            # Parsing failed - return error for all articles
            error_result = {
                'success': False,
                'error': f"Failed to parse response: {str(e)}"
            }
            return [error_result.copy() for _ in range(expected_count)]


# Convenience function for easy usage
def process_articles_batch(articles: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Process a batch of articles using Gemini API.

    Args:
        articles: List of dicts with 'title' and 'content' keys (max 3)

    Returns:
        List of processing results

    Example:
        articles = [
            {'title': 'AI startup raises $10M', 'content': '...'},
            {'title': 'New AI policy announced', 'content': '...'}
        ]
        results = process_articles_batch(articles)
    """
    processor = GeminiProcessor()
    return processor.process_batch(articles)
