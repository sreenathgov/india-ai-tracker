"""
LLM Adjudicator - Final Quality Gate for Article Pipeline

Purpose:
- Correct deterministic edge-case errors
- Improve labeling, categorisation, geo attribution confidence
- Prevent embarrassing false positives

The LLM runs ONLY after all deterministic filters have passed.
It may override previous decisions but is designed as a safety net,
not a primary filter.

Toggle: Set LLM_ADJUDICATOR_ENABLED=false to disable.
"""

import os
import json
import re
from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class AdjudicatorResult:
    """Result from LLM adjudication."""
    is_ai_relevant: bool
    is_india_relevant: bool
    category: str
    state_codes: List[str]
    event_status: str  # 'future', 'past', 'none'
    confidence: int
    should_drop: bool
    drop_reason: Optional[str]
    llm_reasoning: str
    original_preserved: bool  # True if LLM agreed with deterministic decision


# Valid categories (must match categoriser.py)
VALID_CATEGORIES = [
    'Policies and Initiatives',
    'AI Start-Up News',
    'Major AI Developments',
    'Events'
]

# State codes
VALID_STATE_CODES = [
    'IN',  # All India
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN', 'GA',
    'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML',
    'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TG',
    'TR', 'UP', 'UT', 'WB'
]


class LLMAdjudicator:
    """
    Final LLM-based quality gate for surviving articles.

    Runs after all deterministic filters and may override decisions.
    Designed to catch edge cases that slip through pattern matching.
    """

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize the adjudicator.

        Args:
            api_key: Gemini API key (defaults to env GEMINI_API_KEY)
            model: Model to use (defaults to gemini-2.0-flash)
        """
        self.enabled = os.getenv('LLM_ADJUDICATOR_ENABLED', 'true').lower() != 'false'
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model_name = model or os.getenv('LLM_ADJUDICATOR_MODEL', 'gemini-2.0-flash')

        self.processor = None
        self._init_count = 0

    def _ensure_initialized(self):
        """Lazy initialization of Gemini client."""
        if self.processor is not None:
            return True

        if not self.api_key:
            print("⚠️  LLM Adjudicator: No GEMINI_API_KEY set")
            return False

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.processor = genai.GenerativeModel(self.model_name)
            self._init_count += 1
            return True
        except Exception as e:
            print(f"⚠️  LLM Adjudicator init failed: {e}")
            return False

    def adjudicate(self, article: Dict[str, Any]) -> AdjudicatorResult:
        """
        Adjudicate a single article that has passed all deterministic filters.

        Args:
            article: Article dict with:
                - title: Article headline
                - content: Article content
                - category: Deterministic category assignment
                - state_codes: Deterministic state assignment
                - ai_validation_reason: Reason from AI validator
                - india_validation_reason: Reason from India validator
                - geo_attribution_reason: Reason from geo attributor

        Returns:
            AdjudicatorResult with final decision
        """
        if not self.enabled:
            return self._passthrough_result(article, "LLM_DISABLED")

        if not self._ensure_initialized():
            return self._passthrough_result(article, "LLM_INIT_FAILED")

        title = article.get('title', '')
        content = article.get('content', '')[:2000]
        current_category = article.get('category', 'Unknown')
        current_states = article.get('state_codes', ['IN'])

        # Build prompt
        prompt = self._build_prompt(title, content, article)

        try:
            response = self.processor.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.1,
                    'max_output_tokens': 800
                }
            )

            result = self._parse_response(response.text, article)
            return result

        except Exception as e:
            print(f"⚠️  LLM Adjudicator error: {e}")
            return self._passthrough_result(article, f"LLM_ERROR:{str(e)[:50]}")

    def adjudicate_batch(self, articles: List[Dict[str, Any]]) -> List[AdjudicatorResult]:
        """
        Adjudicate a batch of articles.

        Args:
            articles: List of article dicts

        Returns:
            List of AdjudicatorResult objects
        """
        results = []
        for article in articles:
            result = self.adjudicate(article)
            results.append(result)
        return results

    def _build_prompt(self, title: str, content: str, article: Dict[str, Any]) -> str:
        """Build the adjudication prompt."""
        current_category = article.get('category', 'Unknown')
        current_states = article.get('state_codes', ['IN'])
        ai_reason = article.get('ai_validation_reason', 'N/A')
        india_reason = article.get('india_validation_reason', 'N/A')
        geo_reason = article.get('geo_attribution_reason', 'N/A')

        return f"""You are the FINAL QUALITY GATE for an India AI news tracker.
This article has PASSED all deterministic filters. Your job is to catch edge-case errors.

ARTICLE:
Title: {title}
Content (first 2000 chars): {content}

CURRENT PIPELINE DECISIONS:
- Category: {current_category}
- States: {current_states}
- AI Validation: {ai_reason}
- India Validation: {india_reason}
- Geo Attribution: {geo_reason}

ANSWER THESE 5 QUESTIONS:

1. IS THIS ARTICLE MATERIALLY ABOUT AI?
   - YES if: AI/ML/GenAI is the subject (product, research, policy, startup, event)
   - NO if: AI is just mentioned in passing, or it's about robotics/automation without AI
   - NO if: It's about smart cameras, smart meters, automation without ML/AI core

2. IS THIS ARTICLE MATERIALLY ABOUT INDIA?
   - YES if: India is where the action happens (Indian company, Indian city, Indian govt, event in India)
   - NO if: India is just mentioned as a comparison ("countries like India")
   - NO if: India is just a future expansion target ("plans to enter India")
   - NO if: Global news with no substantive India component

3. CORRECT CATEGORY (select ONE):
   - "Policies and Initiatives": Government is the ACTOR — launching/inaugurating centres, announcing policies, minister statements, govt programs, setting up infrastructure, government schemes, MoUs by govt bodies. If a CM/minister/govt body launches, inaugurates, or sets up ANY facility (innovation centre, AI hub, research lab, etc.), this IS "Policies and Initiatives" even if a private company (IBM, Google, etc.) is the partner.
   - "AI Start-Up News": Indian startup is subject/object (funding, launch, acquisition)
   - "Events": Conferences, summits, hackathons, workshops
   - "Major AI Developments": Everything else (big tech, research, market trends) — use this ONLY when government is NOT the driving actor

4. CORRECT STATE CODES:
   - Use 2-letter codes: TN, KA, MH, DL, TG, etc.
   - Use ["IN"] for national/all-India/multi-state
   - ONLY tag states that are SUBSTANTIVELY discussed in the article content
   - DO NOT tag based on company HQ if news is global
   - DO NOT tag based on the publication source (e.g., an article from a Kashmir newspaper about a national India topic should be ["IN"], NOT ["JK"]). The news must be materially or substantively ABOUT a state to warrant that state code.

5. EVENT STATUS (if category is Events):
   - "future": Event is upcoming (registration open, "to be held", future date)
   - "past": Event has concluded (highlights, recap, "held on", past date)
   - "none": Not an event

DECISION LOGIC:
- If BOTH AI and India are NO → RECOMMEND DROP
- If the article is about a PAST event → RECOMMEND DROP
- Otherwise → KEEP with corrected labels

Respond with ONLY valid JSON:
{{
  "is_ai_relevant": true,
  "ai_reasoning": "Short explanation",
  "is_india_relevant": true,
  "india_reasoning": "Short explanation",
  "category": "Major AI Developments",
  "state_codes": ["IN"],
  "event_status": "none",
  "should_drop": false,
  "drop_reason": null,
  "confidence": 90
}}
"""

    def _parse_response(self, response_text: str, article: Dict[str, Any]) -> AdjudicatorResult:
        """Parse the LLM response into an AdjudicatorResult."""
        try:
            # Extract JSON from response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1

            if start == -1 or end == 0:
                raise ValueError("No JSON found in response")

            json_str = response_text[start:end]
            data = json.loads(json_str)

            # Validate and normalize
            is_ai = data.get('is_ai_relevant', True)
            is_india = data.get('is_india_relevant', True)
            category = data.get('category', article.get('category', 'Major AI Developments'))
            state_codes = data.get('state_codes', article.get('state_codes', ['IN']))
            event_status = data.get('event_status', 'none')
            should_drop = data.get('should_drop', False)
            drop_reason = data.get('drop_reason')
            confidence = int(data.get('confidence', 80))

            # Validate category
            if category not in VALID_CATEGORIES:
                category = 'Major AI Developments'

            # Validate state codes
            state_codes = [s for s in state_codes if s in VALID_STATE_CODES]
            if not state_codes:
                state_codes = ['IN']

            # Determine if LLM agrees with deterministic decision
            original_category = article.get('category', '')
            original_states = set(article.get('state_codes', []))
            llm_states = set(state_codes)
            original_preserved = (
                category == original_category and
                llm_states == original_states and
                not should_drop
            )

            # Build reasoning string
            ai_reasoning = data.get('ai_reasoning', '')
            india_reasoning = data.get('india_reasoning', '')
            reasoning = f"AI:{ai_reasoning}; India:{india_reasoning}"

            return AdjudicatorResult(
                is_ai_relevant=is_ai,
                is_india_relevant=is_india,
                category=category,
                state_codes=state_codes,
                event_status=event_status,
                confidence=confidence,
                should_drop=should_drop,
                drop_reason=drop_reason,
                llm_reasoning=reasoning,
                original_preserved=original_preserved
            )

        except Exception as e:
            print(f"⚠️  Failed to parse LLM response: {e}")
            return self._passthrough_result(article, f"PARSE_ERROR:{str(e)[:30]}")

    def _passthrough_result(self, article: Dict[str, Any], reason: str) -> AdjudicatorResult:
        """Return a passthrough result that preserves deterministic decisions."""
        return AdjudicatorResult(
            is_ai_relevant=True,
            is_india_relevant=True,
            category=article.get('category', 'Major AI Developments'),
            state_codes=article.get('state_codes', ['IN']),
            event_status='none',
            confidence=0,
            should_drop=False,
            drop_reason=None,
            llm_reasoning=f"PASSTHROUGH:{reason}",
            original_preserved=True
        )


def test_adjudicator():
    """Test the LLM adjudicator with sample articles."""
    print("\n" + "=" * 70)
    print("LLM ADJUDICATOR TEST")
    print("=" * 70 + "\n")

    adjudicator = LLMAdjudicator()

    if not adjudicator.enabled:
        print("⚠️  Adjudicator is disabled (LLM_ADJUDICATOR_ENABLED=false)")
        return

    test_cases = [
        # Should KEEP - valid AI + India article
        {
            'title': 'TCS launches new AI platform for enterprise customers',
            'content': 'Tata Consultancy Services today launched an AI-powered platform for enterprises...',
            'category': 'Major AI Developments',
            'state_codes': ['MH'],
            'expected_keep': True
        },
        # Should DROP - not AI (robotics without AI)
        {
            'title': 'New robotic arm installed in Bangalore factory',
            'content': 'A new industrial robotic arm has been installed at the manufacturing facility...',
            'category': 'Major AI Developments',
            'state_codes': ['KA'],
            'expected_keep': False  # Should be dropped - robotics without AI
        },
        # Should DROP - speculative India mention
        {
            'title': 'OpenAI plans to expand to countries like India',
            'content': 'The company is considering expansion into emerging markets including India and Brazil...',
            'category': 'Major AI Developments',
            'state_codes': ['IN'],
            'expected_keep': False  # Should be dropped - speculative
        },
        # Should KEEP - valid policy article
        {
            'title': 'Karnataka government announces AI skilling initiative',
            'content': 'The Karnataka state government today announced a major AI skilling program...',
            'category': 'Policies and Initiatives',
            'state_codes': ['KA'],
            'expected_keep': True
        },
    ]

    for i, test in enumerate(test_cases):
        print(f"\nTest {i+1}: {test['title'][:50]}...")
        result = adjudicator.adjudicate(test)

        actual_keep = not result.should_drop
        status = '✓' if actual_keep == test['expected_keep'] else '✗'

        print(f"  {status} Keep: {actual_keep} (expected: {test['expected_keep']})")
        print(f"    AI Relevant: {result.is_ai_relevant}")
        print(f"    India Relevant: {result.is_india_relevant}")
        print(f"    Category: {result.category}")
        print(f"    States: {result.state_codes}")
        print(f"    Confidence: {result.confidence}")
        if result.should_drop:
            print(f"    Drop Reason: {result.drop_reason}")
        print(f"    Reasoning: {result.llm_reasoning[:100]}...")

    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    test_adjudicator()
