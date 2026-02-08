"""
AI Subject Validator (Layer 1)

Validates that AI is the SUBJECT of an article, not merely mentioned.
High recall preference - when uncertain, lean toward PASS.

Decision Flow:
1. Title AI signal → DEFINITE PASS
2. Non-AI subject in title → DEFINITE DROP
3. Archetype pattern match → PASS
4. AI substance in content (3+) → PASS
5. Borderline (1-2 substance) → LLM verification
6. No signals → DROP

Gold Standard Archetypes (must always pass):
1. AI product/feature launch
2. AI research/paper publication
3. AI company funding/acquisition
4. AI infrastructure investment
5. AI policy/regulation
6. AI talent/hiring news
7. AI application in specific domain
8. AI partnership/collaboration
9. AI event/summit
10. AI market/industry trends
"""

import re
from typing import Dict, List, Any
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Result of AI subject validation."""
    passed: bool
    reason: str
    ai_score: int
    matched_patterns: List[str] = field(default_factory=list)
    archetype: str = None
    llm_used: bool = False
    confidence: str = 'high'  # high, medium, borderline


class AISubjectValidator:
    """
    Validates that AI is materially discussed in an article.

    Core principle: AI must be the SUBJECT, not merely mentioned.
    High recall preference - when uncertain, lean toward PASS.
    """

    # =========================================================================
    # TITLE AI SIGNALS - Split into STRONG (auto-pass) and WEAK (need content)
    # =========================================================================

    # STRONG AI signals - auto-pass in title (definite AI discussion)
    TITLE_AI_STRONG = [
        r'\b(?:artificial\s+intelligence)\b',
        r'\b(?:machine\s+learning|ML)\b',
        r'\b(?:deep\s+learning|DL)\b',
        r'\b(?:gen(?:erative)?\s*AI|GenAI)\b',
        r'\b(?:large\s+language\s+model|LLM)s?\b',
        r'\b(?:GPT|ChatGPT|Claude|Gemini|Llama|Mistral|Phi)\b',
        r'\b(?:neural\s+network)s?\b',
        r'\b(?:NLP|natural\s+language\s+processing)\b',
        r'\b(?:computer\s+vision)\b',  # Removed CV - too ambiguous
        r'\b(?:transformer|diffusion)\s+model\b',
        # AI alone (but not AI-powered/AI-driven which are weak)
        r'\bAI\b(?!\s*-?\s*(?:powered|driven|enabled|based))',
    ]

    # WEAK AI signals - require content reinforcement (often marketing buzzwords)
    TITLE_AI_WEAK = [
        r'\b(?:robotics?|autonomous)\b',  # Could be simple automation
        r'\bCopilot\b',  # Could be brand name reference
        r'\b(?:AI|ML)\s*-?\s*(?:powered|driven|enabled|based)\b',  # Often marketing
        r'\bsmart\s+(?:city|cities|camera|device|home|meter|grid)\b',  # Often non-AI
        r'\bautomation\b',  # Often non-AI automation
        r'\bintelligent\s+(?:system|solution|platform)\b',  # Vague
    ]

    # Legacy: Keep TITLE_AI_SIGNALS as union for backward compatibility
    TITLE_AI_SIGNALS = TITLE_AI_STRONG + TITLE_AI_WEAK

    # ARCHETYPE PATTERNS (gold standard must-pass)
    # These patterns match the 10 archetypes that must always pass
    ARCHETYPE_PATTERNS = {
        'product_launch': [
            r'\b(?:launch|unveil|release|introduce|announce)(?:es|ed|ing|s)?\b.*\b(?:AI|ML|GenAI|artificial\s+intelligence)\b',
            r'\b(?:AI|ML|GenAI)\b.*\b(?:tool|product|feature|solution|platform|assistant|chatbot)\b',
            r'\b(?:AI|ML)\s*-?\s*(?:powered|driven|enabled|based)\b',
        ],
        'research_paper': [
            r'\b(?:research|study|paper|breakthrough|discovery|innovation)\b.*\b(?:AI|ML|NLP|deep\s+learning)\b',
            r'\b(?:IIT|IIIT|IISc|university|institute|lab|researcher)s?\b.*\b(?:AI|ML|neural)\b',
            r'\b(?:AI|ML)\b.*\b(?:research|study|paper|breakthrough)\b',
        ],
        'funding_acquisition': [
            r'\b(?:raise|secure|funding|series\s+[A-Z]|acquisition|acquire|invest)(?:s|ed|ing|ment)?\b.*\b(?:AI|ML|GenAI)\b',
            r'\b(?:AI|ML|GenAI)\s+(?:startup|company|firm|venture)\b.*\b(?:\$|₹|Rs\.?|crore|million|billion)\b',
            r'\b(?:AI|ML)\b.*\b(?:funding|investment|valuation|round)\b',
        ],
        'infrastructure': [
            r'\b(?:data\s+cent(?:re|er)|GPU|chip|semiconductor|fab|foundry)\b.*\b(?:AI|ML)\b',
            r'\b(?:AI|ML)\b.*\b(?:infrastructure|compute|cloud|hardware|accelerator)\b',
            r'\b(?:NVIDIA|AMD|Intel)\b.*\b(?:AI|ML|GPU)\b',
        ],
        'policy_regulation': [
            r'\b(?:policy|regulation|framework|guideline|governance|law|act|bill)\b.*\b(?:AI|ML)\b',
            r'\b(?:MeitY|NITI\s+Aayog|government|ministry|parliament)\b.*\b(?:AI|ML)\b',
            r'\b(?:AI|ML)\b.*\b(?:policy|regulation|ethics|governance|compliance)\b',
        ],
        'talent_hiring': [
            r'\b(?:hire|hiring|recruit|talent|engineer|job|career)s?\b.*\b(?:AI|ML|data\s+scientist)\b',
            r'\b(?:AI|ML)\s+(?:team|talent|workforce|engineer|scientist|expert)s?\b',
            r'\b(?:AI|ML)\b.*\b(?:skills?|training|upskilling|reskilling)\b',
        ],
        'domain_application': [
            r'\b(?:AI|ML)\b.*\b(?:healthcare|health|medical|agriculture|agri|finance|fintech|education|edtech|retail|manufacturing|logistics)\b',
            r'\b(?:detect|diagnose|predict|automate|optimize|transform)(?:s|ed|ing)?\b.*\b(?:AI|ML)\b',
            r'\b(?:AI|ML)\b.*\b(?:application|solution|use\s+case|deployment)\b',
        ],
        'partnership': [
            r'\b(?:partner|collaborate|MoU|agreement|alliance|joint\s+venture|tie-?up)\b.*\b(?:AI|ML)\b',
            r'\b(?:AI|ML)\b.*\b(?:partnership|collaboration|alliance|consortium)\b',
        ],
        'event_summit': [
            r'\b(?:summit|conference|workshop|hackathon|meetup|conclave|expo|fest)\b.*\b(?:AI|ML|GenAI|tech)\b',
            r'\b(?:AI|ML|GenAI)\s+(?:summit|conference|event|workshop|hackathon)\b',
        ],
        'market_trends': [
            r'\b(?:market|industry|growth|forecast|trend|outlook|report)\b.*\b(?:AI|ML|GenAI)\b',
            r'\b(?:AI|ML|GenAI)\s+(?:market|industry|adoption|spending|investment)\b',
            r'\b(?:AI|ML)\b.*\b(?:billion|trillion|growth|CAGR)\b',
        ],
    }

    # DEFINITE DROP: Non-AI subjects (unless AI is also mentioned)
    NON_AI_SIGNALS = [
        r'\b(?:cricket|football|hockey|IPL|match|tournament|World\s+Cup)\b',
        r'\b(?:weather|forecast|monsoon|rainfall|temperature|cyclone)\b',
        r'\b(?:election|vote|poll|polling|ballot)\b(?!.*\b(?:AI|ML|artificial)\b)',
        r'\b(?:bollywood|celebrity|actor|actress|film|movie|star)\b(?!.*\b(?:AI|ML|artificial)\b)',
        r'\b(?:accident|crime|murder|theft|arrest|robbery|death)\b',
        r'\b(?:recipe|cooking|food|restaurant|cuisine)\b(?!.*\b(?:AI|ML|artificial)\b)',
        r'\b(?:horoscope|astrology|zodiac)\b',
    ]

    # AI SUBSTANCE SIGNALS (content check)
    # These indicate AI is being materially discussed, not just mentioned
    AI_SUBSTANCE_TERMS = [
        r'\b(?:train(?:s|ed|ing)?|fine-?tun(?:e|ed|ing)?)\s+(?:the\s+)?(?:model|AI|ML|network)\b',
        r'\b(?:inference|prediction|classification|recognition)\b',
        r'\b(?:model|algorithm|neural\s+network|transformer|attention\s+mechanism)\b',
        r'\b(?:dataset|training\s+data|corpus|benchmark)\b',
        r'\b(?:deploy(?:s|ed|ing|ment)?|implement(?:s|ed|ing|ation)?)\b.*(?:AI|ML|model)',
        r'\b(?:GPU|TPU|CUDA|tensor|vector|embedding)s?\b',
        r'\b(?:accuracy|precision|recall|F1|loss|epoch)s?\b',
        r'\b(?:prompt|token|parameter|weight|gradient)s?\b',
        r'\b(?:reinforcement\s+learning|supervised|unsupervised|self-?supervised)\b',
        r'\b(?:LLM|GPT|BERT|transformer|diffusion)\b',
    ]

    # Additional strong AI indicators in content
    AI_STRONG_INDICATORS = [
        r'\b(?:artificial\s+intelligence|machine\s+learning)\b',
        r'\b(?:deep\s+learning|neural)\b',
        r'\b(?:generative\s+AI|GenAI)\b',
        r'\b(?:ChatGPT|GPT-?[0-9]|Claude|Gemini|Llama|Mistral)\b',
        r'\b(?:AI|ML)\s+(?:model|system|platform|solution|tool)\b',
    ]

    def __init__(self):
        """Initialize validator with compiled patterns."""
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile all regex patterns for performance."""
        # New tiered title patterns
        self.title_strong_patterns = [re.compile(p, re.I) for p in self.TITLE_AI_STRONG]
        self.title_weak_patterns = [re.compile(p, re.I) for p in self.TITLE_AI_WEAK]
        # Legacy combined patterns (for backward compatibility)
        self.title_patterns = [re.compile(p, re.I) for p in self.TITLE_AI_SIGNALS]
        self.non_ai_patterns = [re.compile(p, re.I) for p in self.NON_AI_SIGNALS]
        self.substance_patterns = [re.compile(p, re.I) for p in self.AI_SUBSTANCE_TERMS]
        self.strong_patterns = [re.compile(p, re.I) for p in self.AI_STRONG_INDICATORS]

        self.archetype_compiled = {}
        for archetype, patterns in self.ARCHETYPE_PATTERNS.items():
            self.archetype_compiled[archetype] = [re.compile(p, re.I) for p in patterns]

    def validate(self, title: str, content: str = "") -> ValidationResult:
        """
        Validate that AI is materially discussed in the article.

        Args:
            title: Article title
            content: Article content (body text)

        Returns:
            ValidationResult with decision and audit trail
        """
        title = title or ""
        content = content or ""
        text = f"{title} {content[:2000]}"
        matched_patterns = []

        # STEP 1a: Check title for STRONG AI signal → DEFINITE PASS
        for pattern in self.title_strong_patterns:
            if pattern.search(title):
                matched_patterns.append(f"TITLE_STRONG:{pattern.pattern[:40]}")
                return ValidationResult(
                    passed=True,
                    reason='TITLE_AI_STRONG',
                    ai_score=90,
                    matched_patterns=matched_patterns,
                    confidence='high'
                )

        # STEP 1b: Check title for WEAK AI signal → Requires content reinforcement
        weak_title_match = None
        for pattern in self.title_weak_patterns:
            if pattern.search(title):
                weak_title_match = pattern.pattern[:40]
                matched_patterns.append(f"TITLE_WEAK:{weak_title_match}")
                break

        # If weak title match, check for content reinforcement before passing
        if weak_title_match:
            # Count content substance signals
            content_substance = 0
            for pattern in self.substance_patterns:
                if pattern.search(content):
                    content_substance += 1
                    matched_patterns.append(f"SUBSTANCE:{pattern.pattern[:30]}")
            for pattern in self.strong_patterns:
                if pattern.search(content):
                    content_substance += 1
                    matched_patterns.append(f"STRONG:{pattern.pattern[:30]}")

            # Weak title + 2+ content signals → PASS
            if content_substance >= 2:
                return ValidationResult(
                    passed=True,
                    reason='TITLE_WEAK_CONTENT_REINFORCED',
                    ai_score=75,
                    matched_patterns=matched_patterns,
                    confidence='medium'
                )

            # Weak title + 1 content signal → LLM verification
            if content_substance >= 1:
                llm_result = self._llm_verify(title, content[:500])
                return ValidationResult(
                    passed=llm_result['is_subject'],
                    reason=f"TITLE_WEAK_LLM:{llm_result['classification']}",
                    ai_score=60 if llm_result['is_subject'] else 20,
                    matched_patterns=matched_patterns,
                    llm_used=True,
                    confidence='borderline'
                )

            # Weak title + no content signals → DROP
            return ValidationResult(
                passed=False,
                reason='TITLE_WEAK_NO_SUBSTANCE',
                ai_score=15,
                matched_patterns=matched_patterns,
                confidence='medium'
            )

        # STEP 2: Check for definite non-AI subject → DEFINITE DROP
        for pattern in self.non_ai_patterns:
            if pattern.search(title):
                return ValidationResult(
                    passed=False,
                    reason='NON_AI_SUBJECT',
                    ai_score=0,
                    matched_patterns=[f"NON_AI:{pattern.pattern[:40]}"],
                    confidence='high'
                )

        # STEP 3: Check for archetype match → PASS
        for archetype, patterns in self.archetype_compiled.items():
            for pattern in patterns:
                if pattern.search(text):
                    matched_patterns.append(f"ARCHETYPE:{archetype}")
                    return ValidationResult(
                        passed=True,
                        reason=f'ARCHETYPE_MATCH:{archetype}',
                        ai_score=85,
                        matched_patterns=matched_patterns,
                        archetype=archetype,
                        confidence='high'
                    )

        # STEP 4: Check content for AI substance
        substance_count = 0
        for pattern in self.substance_patterns:
            if pattern.search(content):
                substance_count += 1
                matched_patterns.append(f"SUBSTANCE:{pattern.pattern[:40]}")

        # Also check for strong AI indicators
        strong_count = 0
        for pattern in self.strong_patterns:
            if pattern.search(content):
                strong_count += 1
                matched_patterns.append(f"STRONG:{pattern.pattern[:40]}")

        total_signals = substance_count + strong_count

        if total_signals >= 3:
            return ValidationResult(
                passed=True,
                reason='CONTENT_AI_SUBSTANCE',
                ai_score=70 + (total_signals * 5),
                matched_patterns=matched_patterns,
                confidence='medium'
            )

        # STEP 5: Borderline case - use LLM
        if total_signals >= 1:
            llm_result = self._llm_verify(title, content[:500])
            return ValidationResult(
                passed=llm_result['is_subject'],
                reason=f"LLM_VERIFIED:{llm_result['classification']}",
                ai_score=60 if llm_result['is_subject'] else 20,
                matched_patterns=matched_patterns,
                llm_used=True,
                confidence='borderline'
            )

        # STEP 6: No AI signals found → DROP
        return ValidationResult(
            passed=False,
            reason='NO_AI_SIGNAL',
            ai_score=0,
            matched_patterns=[],
            confidence='high'
        )

    def _llm_verify(self, title: str, content: str) -> Dict[str, Any]:
        """
        Use LLM to verify if AI is the subject.

        Args:
            title: Article title
            content: First 500 chars of content

        Returns:
            Dict with is_subject (bool) and classification (str)
        """
        import os

        try:
            from groq import Groq

            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                # No API key - lean toward PASS (high recall preference)
                return {'is_subject': True, 'classification': 'NO_API_KEY_PASS'}

            client = Groq(api_key=api_key)

            prompt = f"""Is AI/ML the SUBJECT of this article, or merely mentioned?

Title: {title}
Content: {content}

Answer with ONE word: SUBJECT, MENTIONED, or NEITHER

- SUBJECT: AI is what the article is primarily about
- MENTIONED: AI is referenced but not the main topic
- NEITHER: No real AI discussion"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=10
            )

            answer = response.choices[0].message.content.strip().upper()
            # Handle variations
            if 'SUBJECT' in answer:
                classification = 'SUBJECT'
            elif 'MENTIONED' in answer:
                classification = 'MENTIONED'
            elif 'NEITHER' in answer:
                classification = 'NEITHER'
            else:
                classification = answer[:20]  # Unknown response

            return {
                'is_subject': classification == 'SUBJECT',
                'classification': classification
            }
        except Exception as e:
            # On LLM failure, lean toward PASS (high recall preference)
            return {'is_subject': True, 'classification': f'FALLBACK_PASS:{str(e)[:30]}'}

    def filter_article(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter a single article - compatibility method for orchestrator.

        Args:
            article: Dict with 'title' and 'content' keys

        Returns:
            Dict with validation results in rule_filter compatible format
        """
        title = article.get('title', '')
        content = article.get('content', '')

        result = self.validate(title, content)

        return {
            'passed': result.passed,
            'total_score': result.ai_score,
            'ai_score': result.ai_score,
            'india_score': 0,  # Not checking India here - that's done elsewhere
            'confidence': result.confidence,
            'llm_verified': result.llm_used,
            'ai_matches': result.matched_patterns[:5],
            'india_matches': [],
            'matched_categories': [result.archetype] if result.archetype else [],
            'importance_hints': [],
            'breakdown': {
                'reason': result.reason,
                'archetype': result.archetype,
                'llm_used': result.llm_used,
                'patterns_matched': len(result.matched_patterns)
            }
        }


def test_validator():
    """Test the AI Subject Validator with sample articles."""
    validator = AISubjectValidator()

    test_cases = [
        # MUST PASS - Gold Standard Archetypes (with content substance)
        ("Zoho launches analytics tool", "Uses machine learning models for prediction", True, "product_launch"),
        ("IIT Madras researchers publish NLP breakthrough", "", True, "research_paper"),
        ("Sarvam AI raises $50M Series B funding", "", True, "funding_acquisition"),
        ("Microsoft to build AI data centre in Hyderabad", "", True, "infrastructure"),
        ("MeitY releases AI governance framework", "", True, "policy_regulation"),
        ("TCS to hire 10,000 AI engineers in 2026", "", True, "talent_hiring"),
        ("AI tool detects cancer in 30 seconds", "", True, "domain_application"),
        ("Google partners with IIIT for AI research", "", True, "partnership"),
        ("India AI Summit 2026 at Bangalore", "", True, "event_summit"),
        ("India's GenAI market to reach $17B by 2030", "", True, "market_trends"),

        # MUST DROP - Non-AI subjects
        ("India vs Australia cricket match highlights", "", False, None),
        ("Mumbai weather forecast for tomorrow", "", False, None),
        ("Bollywood star launches new perfume brand", "", False, None),

        # STRONG Title AI signals → PASS
        ("New machine learning model achieves record accuracy", "", True, None),
        ("ChatGPT users reach 200 million milestone", "", True, None),
        ("Neural network architecture improves efficiency", "", True, None),

        # WEAK Title signals without content → DROP
        ("Robotic automation deployed in factory", "", False, None),
        ("AI-powered marketing tool launched", "", False, None),
        ("Smart city initiative announced", "", False, None),

        # WEAK Title signals WITH content → PASS
        ("AI-powered tool launched", "The model uses deep learning and neural networks for inference", True, None),
        ("Robotics system unveiled", "Uses transformer models trained on large datasets with GPU acceleration", True, None),
    ]

    print("\n" + "=" * 70)
    print("AI SUBJECT VALIDATOR TEST")
    print("=" * 70 + "\n")

    passed_tests = 0
    failed_tests = 0

    for title, content, expected_pass, expected_archetype in test_cases:
        result = validator.validate(title, content)
        test_passed = result.passed == expected_pass

        if test_passed:
            passed_tests += 1
            status = "✅ PASS"
        else:
            failed_tests += 1
            status = "❌ FAIL"

        print(f"{status}: {title[:50]}...")
        print(f"    Expected: {'PASS' if expected_pass else 'DROP'}, Got: {'PASS' if result.passed else 'DROP'}")
        print(f"    Reason: {result.reason}")
        if result.archetype:
            print(f"    Archetype: {result.archetype}")
        print()

    print("=" * 70)
    print(f"Results: {passed_tests} passed, {failed_tests} failed")
    print("=" * 70)


if __name__ == "__main__":
    test_validator()
