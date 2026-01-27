"""
Ollama Local Client for Layer 2 Fallback

Runs Llama 3.2 3B locally on your Mac as fallback when Groq fails.
No API costs, but slower (~10 tokens/sec vs 100+ with Groq).

Installation:
    brew install ollama
    ollama serve
    ollama pull llama3.2:3b
"""

import os
import json
import requests
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)


class OllamaClient:
    """
    Ollama local model client for batch article processing.

    Uses same interface as GroqClient for easy fallback.
    """

    def __init__(self, host: str = None, model: str = None):
        """
        Initialize Ollama client.

        Args:
            host: Ollama server URL (defaults to http://localhost:11434)
            model: Model name (defaults to llama3.2:3b)
        """
        self.host = host or os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        self.model = model or os.getenv('OLLAMA_MODEL', 'llama3.2:3b')

        # Test connection
        if not self._test_connection():
            print(f"⚠️  Ollama not running at {self.host}")
            print("   Start with: ollama serve")

    def _test_connection(self) -> bool:
        """Test if Ollama is running."""
        try:
            response = requests.get(f"{self.host}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False

    def _build_batch_prompt(self, articles: List[Dict[str, str]]) -> str:
        """
        Build combined prompt for batch processing.

        Same format as Groq client for consistency.

        Args:
            articles: List of dicts with 'title' and 'content'

        Returns:
            Combined prompt string
        """
        prompt = """You are analyzing articles about AI developments in India. For EACH article below, provide:

1. AI Relevance: Is this PRIMARILY about AI? (YES/NO + confidence score 0-100)
2. Category: Major AI Developments, AI Policy & Regulation, AI Start-Up News, AI Research & Innovation, AI Products & Applications, or AI Infrastructure & Compute
3. State Attribution: JSON array of state codes (["KA"], ["TN"], ["IN"] for national, etc.)
4. Summary: 2-3 sentences

Articles:

"""

        for i, article in enumerate(articles, 1):
            content = article.get('content', '')[:1500]
            prompt += f"""
ARTICLE {i}:
Title: {article['title']}
Content: {content}

---
"""

        prompt += """

Respond ONLY with valid JSON:
[
  {"article_number": 1, "is_relevant": true, "confidence": 95, "category": "Major AI Developments", "state_codes": ["KA"], "summary": "..."},
  ...
]
"""

        return prompt

    def _parse_response(self, response_text: str, num_articles: int) -> List[Dict[str, Any]]:
        """Parse JSON response from Ollama."""
        try:
            # Extract JSON from response
            start = response_text.find('[')
            end = response_text.rfind(']') + 1

            if start == -1 or end == 0:
                raise ValueError("No JSON array found")

            json_str = response_text[start:end]
            results = json.loads(json_str)

            if not isinstance(results, list):
                raise ValueError("Response is not a list")

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

        except (json.JSONDecodeError, ValueError) as e:
            print(f"❌ Failed to parse Ollama response: {e}")
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
        Process a batch of articles with local Ollama.

        Args:
            articles: List of article dicts with 'title', 'content'

        Returns:
            List of results (one per article)

        Raises:
            Exception: On errors
        """
        if len(articles) > 10:
            raise ValueError("Batch size must be ≤ 10 articles")

        if len(articles) == 0:
            return []

        # Build prompt
        prompt = self._build_batch_prompt(articles)

        try:
            # Call Ollama API
            response = requests.post(
                f"{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 2000
                    }
                },
                timeout=300  # 5 minutes max (local processing can be slow)
            )

            if response.status_code != 200:
                raise Exception(f"Ollama API error: {response.status_code} - {response.text}")

            # Parse response
            response_data = response.json()
            response_text = response_data.get('response', '')

            results = self._parse_response(response_text, len(articles))

            return results

        except requests.exceptions.Timeout:
            raise Exception("Ollama request timed out (5 minutes). Model may be too slow.")
        except requests.exceptions.ConnectionError:
            raise Exception(f"Cannot connect to Ollama at {self.host}. Is it running? (ollama serve)")
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")

    def test_connection(self) -> bool:
        """Test if Ollama is accessible."""
        try:
            test_article = [{
                'title': 'Test article about AI in India',
                'content': 'This is a test article about artificial intelligence in India.'
            }]

            results = self.process_batch(test_article)
            return len(results) > 0

        except Exception as e:
            print(f"❌ Ollama connection test failed: {e}")
            return False


def test_ollama_client():
    """Test Ollama client with sample articles."""
    print("\n" + "="*70)
    print("OLLAMA CLIENT TEST")
    print("="*70 + "\n")

    try:
        client = OllamaClient()
        print(f"✅ Initialized Ollama client (model: {client.model})")

        test_articles = [
            {
                'title': 'IIT Madras launches AI research center',
                'content': 'Indian Institute of Technology Madras announced a new artificial intelligence research center...'
            },
            {
                'title': 'Google expands AI team in Bangalore',
                'content': 'Google India is expanding its machine learning team in Bangalore...'
            }
        ]

        print(f"\nProcessing {len(test_articles)} test articles (this may take 30-60 seconds)...\n")

        results = client.process_batch(test_articles)

        for i, result in enumerate(results, 1):
            print(f"Article {i}:")
            print(f"  Relevant: {result['is_relevant']} (confidence: {result['confidence']}%)")
            print(f"  Category: {result['category']}")
            print(f"  States: {result['state_codes']}")
            print(f"  Summary: {result['summary'][:80]}...")
            print()

        print("✅ Ollama client test passed!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("\nTo install Ollama:")
        print("  1. brew install ollama")
        print("  2. ollama serve")
        print("  3. ollama pull llama3.2:3b")


if __name__ == "__main__":
    test_ollama_client()
