"""
Groq API Client for Layer 2 Batch Processing

Uses Groq's Llama 3.1 70B model for efficient bulk article processing.
Free tier: 14,400 requests/day, 131K tokens/minute
"""

import os
import json
import time
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

try:
    from groq import Groq
except ImportError:
    print("⚠️  Groq package not installed. Install with: pip install groq")
    Groq = None


class GroqClient:
    """
    Groq API client for batch article processing.

    Processes 10 articles per API call with combined prompt for:
    - AI relevance check
    - Categorization
    - State attribution
    - Summary generation
    """

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize Groq client.

        Args:
            api_key: Groq API key (defaults to env GROQ_API_KEY)
            model: Model name (defaults to llama-3.1-70b-versatile)
        """
        if Groq is None:
            raise ImportError("Groq package not installed")

        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment")

        self.model = model or os.getenv('LAYER2_MODEL', 'llama-3.3-70b-versatile')
        self.client = Groq(api_key=self.api_key)

        # Rate limiting
        self.requests_per_minute = 30
        self.last_request_time = 0

    def _rate_limit(self):
        """Respect rate limits."""
        elapsed = time.time() - self.last_request_time
        min_interval = 60 / self.requests_per_minute

        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)

        self.last_request_time = time.time()

    def _build_batch_prompt(self, articles: List[Dict[str, str]]) -> str:
        """
        Build combined prompt for batch processing.

        Args:
            articles: List of dicts with 'title' and 'content'

        Returns:
            Combined prompt string
        """
        prompt = """You are analyzing articles about AI developments in India. For EACH article below, provide:

1. AI Relevance: Is this PRIMARILY about AI? (YES/NO + confidence score 0-100)
   - Must be fundamentally about AI technology, products, policy, or AI investments
   - Reject if AI mentioned only tangentially

2. Category: One of these categories ONLY:
   - Major AI Developments
   - AI Policy & Regulation
   - AI Start-Up News
   - AI Research & Innovation
   - AI Products & Applications
   - AI Infrastructure & Compute

3. State Attribution: JSON array of state codes (e.g., ["KA", "TN", "MH"])
   - Use standard 2-letter codes
   - ["IN"] for national/multiple states
   - CRITICAL: Tag a state ONLY if the article content is SUBSTANTIVELY about that state
   - DO NOT tag based on news source domain (ignore telanganatoday.com, hindustantimes, etc.)
   - DO NOT tag unless the state is MATERIALLY discussed in title or content
   - Valid reasons to tag: state government policy, state-specific event, company HQ in that state doing something there
   - If article mentions India broadly or multiple states equally, use ["IN"]

4. Summary: 2-3 sentences capturing key points

Articles to analyze:

"""

        for i, article in enumerate(articles, 1):
            # Truncate content to first 1500 chars for API efficiency
            content = article.get('content', '')[:1500]
            prompt += f"""
ARTICLE {i}:
Title: {article['title']}
Content: {content}

---
"""

        prompt += """

IMPORTANT: Respond ONLY with valid JSON in this exact format:
[
  {
    "article_number": 1,
    "is_relevant": true,
    "confidence": 95,
    "category": "Major AI Developments",
    "state_codes": ["KA"],
    "summary": "Summary text here."
  },
  ...
]

Ensure the JSON is valid and parseable. Include ALL articles in order.
"""

        return prompt

    def _parse_response(self, response_text: str, num_articles: int) -> List[Dict[str, Any]]:
        """
        Parse JSON response from Groq.

        Args:
            response_text: Raw response text
            num_articles: Expected number of articles

        Returns:
            List of result dicts
        """
        try:
            # Try to extract JSON from response
            # Sometimes model includes explanation before/after JSON
            start = response_text.find('[')
            end = response_text.rfind(']') + 1

            if start == -1 or end == 0:
                raise ValueError("No JSON array found in response")

            json_str = response_text[start:end]
            results = json.loads(json_str)

            if not isinstance(results, list):
                raise ValueError("Response is not a list")

            # Validate we got all articles
            if len(results) != num_articles:
                print(f"⚠️  Expected {num_articles} results, got {len(results)}")

            # Standardize format
            standardized = []
            for result in results:
                standardized.append({
                    'article_number': result.get('article_number', 0),
                    'is_relevant': result.get('is_relevant', False),
                    'confidence': float(result.get('confidence', 0)),
                    'category': result.get('category', 'Uncategorized'),
                    'state_codes': result.get('state_codes', []),
                    'summary': result.get('summary', '')
                })

            return standardized

        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON: {e}")
            print(f"Response: {response_text[:500]}...")
            # Return default results
            return [{
                'article_number': i,
                'is_relevant': False,
                'confidence': 0,
                'category': 'Parse Error',
                'state_codes': [],
                'summary': '',
                'error': str(e)
            } for i in range(1, num_articles + 1)]

    def process_batch(self, articles: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Process a batch of articles (up to 10).

        Args:
            articles: List of article dicts with 'title', 'content'

        Returns:
            List of results (one per article)

        Raises:
            Exception: On API errors (caller should handle fallback)
        """
        if len(articles) > 10:
            raise ValueError("Batch size must be ≤ 10 articles")

        if len(articles) == 0:
            return []

        # Rate limiting
        self._rate_limit()

        # Build prompt
        prompt = self._build_batch_prompt(articles)

        try:
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing AI-related news articles about India. You always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Low temperature for consistent output
                max_tokens=2000,  # Enough for 10 article results
                timeout=30.0
            )

            # Parse response
            response_text = response.choices[0].message.content
            results = self._parse_response(response_text, len(articles))

            return results

        except Exception as e:
            # Let caller handle fallback
            error_msg = str(e)

            # Check if it's a rate limit error
            if 'rate' in error_msg.lower() or '429' in error_msg:
                raise Exception(f"Groq rate limit exceeded: {error_msg}")
            elif 'quota' in error_msg.lower():
                raise Exception(f"Groq quota exceeded: {error_msg}")
            else:
                raise Exception(f"Groq API error: {error_msg}")

    def test_connection(self) -> bool:
        """
        Test if Groq API is accessible.

        Returns:
            True if connection successful
        """
        try:
            test_article = [{
                'title': 'Test article about AI in India',
                'content': 'This is a test article about artificial intelligence in India.'
            }]

            results = self.process_batch(test_article)
            return len(results) > 0

        except Exception as e:
            print(f"❌ Groq connection test failed: {e}")
            return False


def test_groq_client():
    """Test Groq client with sample articles."""
    print("\n" + "="*70)
    print("GROQ CLIENT TEST")
    print("="*70 + "\n")

    try:
        client = GroqClient()
        print(f"✅ Initialized Groq client (model: {client.model})")

        test_articles = [
            {
                'title': 'IIT Madras launches AI research center',
                'content': 'Indian Institute of Technology Madras announced a new artificial intelligence research center focused on healthcare applications...'
            },
            {
                'title': 'Google expands AI team in Bangalore',
                'content': 'Google India is expanding its machine learning team in Bangalore to work on generative AI products for the Indian market...'
            },
            {
                'title': 'NITI Aayog releases AI policy framework',
                'content': 'The government think tank published comprehensive guidelines for AI governance in India, focusing on ethical AI development...'
            }
        ]

        print(f"\nProcessing {len(test_articles)} test articles...\n")

        results = client.process_batch(test_articles)

        for i, result in enumerate(results, 1):
            print(f"Article {i}:")
            print(f"  Relevant: {result['is_relevant']} (confidence: {result['confidence']}%)")
            print(f"  Category: {result['category']}")
            print(f"  States: {result['state_codes']}")
            print(f"  Summary: {result['summary'][:80]}...")
            print()

        print("✅ Groq client test passed!")

    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    test_groq_client()
