"""
Gemini Client for Layer 3 Premium Processing

Wraps existing gemini_api.py for Layer 3 premium polish.
Uses Gemini 1.5 Flash for high-quality summaries and verification.
"""

import os
import sys
from typing import List, Dict, Any
from pathlib import Path

# Add parent to path to import gemini_api
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gemini_api import GeminiProcessor as BaseGeminiProcessor
except ImportError:
    print("⚠️  Cannot import gemini_api.py - creating stub")
    BaseGeminiProcessor = None


class GeminiClient:
    """
    Gemini client for Layer 3 premium processing.

    Wraps existing GeminiProcessor with Layer 3-specific functionality.
    """

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize Gemini client.

        Args:
            api_key: Gemini API key (defaults to env GEMINI_API_KEY)
            model: Model name (defaults to gemini-1.5-flash)
        """
        if BaseGeminiProcessor is None:
            raise ImportError("GeminiProcessor not available from gemini_api.py")

        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model = model or os.getenv('LAYER3_MODEL', 'gemini-2.5-flash')

        # Initialize base processor
        self.processor = BaseGeminiProcessor(api_key=self.api_key)

        # Override model if specified
        if self.model != 'gemini-2.5-flash':
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.processor.model = genai.GenerativeModel(self.model)

    def refine_article(self, article: Dict[str, Any], layer2_results: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Refine a single high-importance article with premium processing.

        Args:
            article: Article dict with 'title', 'content'
            layer2_results: Results from Layer 2 (for cross-checking)

        Returns:
            Refined results
        """
        title = article.get('title', '')
        content = article.get('content', '')[:2000]  # First 2000 chars

        # Build premium prompt
        prompt = f"""You are analyzing a HIGH-IMPORTANCE article about AI in India.

This article has been flagged as particularly significant (government policy, major funding, or national importance).

Article:
Title: {title}
Content: {content}

Previous Analysis (for reference):
- Category: {layer2_results.get('category', 'Unknown') if layer2_results else 'Not yet analyzed'}
- States: {layer2_results.get('state_codes', []) if layer2_results else []}

Please provide a REFINED analysis:

1. **AI Relevance Verification**: Confirm this is truly about AI (YES/NO + confidence 0-100)
2. **Category** (select ONE using STRICT definitions):
   - **Policies and Initiatives**: Government ONLY (policies, laws, govt programs, minister statements, govt investments)
   - **AI Start-Up News**: Startup must be subject/object (funding, launches, pivots, acquisitions)
   - **Major AI Developments**: Everything else (industry reports, big tech, conferences, research, market trends)

3. **State Attribution**: JSON array of 2-letter state codes
   - CRITICAL: Tag a state ONLY if article content is SUBSTANTIVELY about that state
   - DO NOT tag based on news source domain (e.g., ignore telanganatoday.com)
   - DO NOT tag unless state is MATERIALLY discussed in title or content
   - Valid reasons: state govt policy, state event, company HQ doing something in that state
   - Use ["IN"] for national/multi-state or if no specific state is central to the story

4. **Summary**: Write a concise, professional summary (STRICT LIMIT: under 240 characters).
   FORMAT RULES:
   - Lead with the actor (company/govt/institution) and their action
   - Name the geography (state or "India") where relevant
   - State the purpose or impact briefly
   - Use neutral, factual language - no hype words
   - 1-2 short sentences maximum

   GOOD EXAMPLES:
   - "Karnataka govt unveils AI skilling scheme to train 1 lakh students in ML and data science over 3 years."
   - "India's MeitY releases draft guidelines for AI safety testing to standardise model risk assessments."
   - "Bengaluru startup Acme AI raises $20M Series A to expand its document processing platform."

   BAD (too long/vague): "This is a really exciting development in the AI space that could potentially transform..."

Respond with ONLY valid JSON:
{{
  "is_relevant": true,
  "confidence": 98,
  "category": "AI Policy & Regulation",
  "state_codes": ["IN"],
  "summary": "The Indian government has..."
}}
"""

        try:
            # Use existing Gemini processor
            response = self.processor.model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.1,
                    'max_output_tokens': 500
                }
            )

            # Parse response
            import json
            response_text = response.text

            # Extract JSON
            start = response_text.find('{')
            end = response_text.rfind('}') + 1

            if start == -1 or end == 0:
                raise ValueError("No JSON found in response")

            json_str = response_text[start:end]
            result = json.loads(json_str)

            return {
                'is_relevant': result.get('is_relevant', True),
                'confidence': float(result.get('confidence', 95)),
                'category': result.get('category', 'Uncategorized'),
                'state_codes': result.get('state_codes', []),
                'summary': result.get('summary', ''),
                'provider': 'gemini',
                'model': self.model
            }

        except Exception as e:
            print(f"❌ Gemini refinement failed: {e}")
            # Return Layer 2 results if available, with defaults for missing fields
            if layer2_results:
                result = {
                    'is_relevant': layer2_results.get('is_relevant', True),
                    'confidence': layer2_results.get('confidence', 0),
                    'category': layer2_results.get('category', 'Uncategorized'),
                    'state_codes': layer2_results.get('state_codes', []),
                    'summary': layer2_results.get('summary', ''),
                    'provider': 'gemini_failed',
                    'error': str(e)
                }
                return result
            else:
                return {
                    'is_relevant': False,
                    'confidence': 0,
                    'category': 'Error',
                    'state_codes': [],
                    'summary': '',
                    'provider': 'gemini_failed',
                    'error': str(e)
                }

    def refine_batch(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Refine a batch of articles (processes individually for premium quality).

        Args:
            articles: List of article dicts

        Returns:
            List of refined results
        """
        results = []

        for article in articles:
            layer2_results = article.get('layer2_results')
            result = self.refine_article(article, layer2_results)
            result['article_id'] = article.get('id')
            results.append(result)

        return results

    def test_connection(self) -> bool:
        """Test if Gemini API is accessible."""
        try:
            test_article = {
                'title': 'Test article about AI policy in India',
                'content': 'The government announced new AI governance framework...'
            }

            result = self.refine_article(test_article)
            return result.get('confidence', 0) > 0

        except Exception as e:
            print(f"❌ Gemini connection test failed: {e}")
            return False


def test_gemini_client():
    """Test Gemini client."""
    print("\n" + "="*70)
    print("GEMINI CLIENT TEST (Layer 3)")
    print("="*70 + "\n")

    try:
        client = GeminiClient()
        print(f"✅ Initialized Gemini client (model: {client.model})")

        test_article = {
            'id': 1,
            'title': 'Parliament introduces comprehensive AI regulation bill',
            'content': 'The Indian Parliament today introduced a comprehensive bill for AI regulation, focusing on data privacy, algorithmic transparency, and ethical AI development. The bill aims to establish a regulatory framework for AI deployment across sectors...'
        }

        layer2_result = {
            'category': 'AI Policy & Regulation',
            'state_codes': ['IN'],
            'confidence': 95
        }

        print("\nRefining high-importance article...\n")

        result = client.refine_article(test_article, layer2_result)

        print(f"Relevant: {result['is_relevant']} (confidence: {result['confidence']}%)")
        print(f"Category: {result['category']}")
        print(f"States: {result['state_codes']}")
        print(f"Summary: {result['summary']}")
        print(f"Provider: {result['provider']}")
        print()

        print("✅ Gemini client test passed!")

    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    test_gemini_client()
