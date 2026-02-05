"""
India Subject Validator (Layer 2)

Validates that India is the SUBJECT of an article, not merely mentioned.
This is a hard gate - articles MUST be India-relevant to pass.

Decision Flow:
1. Title India signal → DEFINITE PASS
2. Non-India subject → DEFINITE DROP
3. Content India substance → PASS
4. Borderline (some signals) → LLM verification
5. No signals → DROP

Gold Standard Archetypes (must always pass):
1. Indian company AI news (TCS, Infosys, etc.)
2. Indian startup funding (Sarvam AI, Krutrim, etc.)
3. Indian government AI policy (MeitY, NITI Aayog)
4. Indian state AI initiative (Karnataka, Tamil Nadu)
5. AI facility in India (data centre in Hyderabad)
6. India AI market/trends
7. Indian institution research (IIT, IISc)
8. AI event in India
9. Indian talent/hiring
10. Foreign company India operations
"""

import re
from typing import Dict, List, Any
from dataclasses import dataclass, field


@dataclass
class IndiaValidationResult:
    """Result of India subject validation."""
    passed: bool
    reason: str
    india_score: int
    matched_patterns: List[str] = field(default_factory=list)
    llm_used: bool = False
    confidence: str = 'high'  # high, medium, borderline


class IndiaSubjectValidator:
    """
    Validates that India is materially discussed in an article.

    Core principle: India must be the SUBJECT, not merely mentioned.
    This is a HARD GATE - all articles must pass to be included.
    """

    # =========================================================================
    # DEFINITE PASS: Strong India signals in title
    # =========================================================================

    # Direct India mentions
    INDIA_DIRECT_SIGNALS = [
        r'\bindia\b',
        r'\bindian\b',
        r'\bindia\'s\b',
    ]

    # Indian states and major cities
    INDIAN_STATES_CITIES = [
        # States
        r'\bkarnataka\b', r'\btamil\s*nadu\b', r'\bmaharashtra\b',
        r'\btelangana\b', r'\bandhra\s*pradesh\b', r'\bkerala\b',
        r'\buttar\s*pradesh\b', r'\bwest\s*bengal\b', r'\bgujarat\b',
        r'\brajasthan\b', r'\bpunjab\b', r'\bharyana\b',
        r'\bdelhi\b', r'\bnew\s*delhi\b', r'\bncr\b',
        r'\bmadhya\s*pradesh\b', r'\bbihar\b', r'\bodisha\b',
        r'\bjharkhand\b', r'\bchhattisgarh\b', r'\bassam\b',
        r'\bgoa\b', r'\bhimachal\b', r'\buttarakhand\b',
        # Major cities
        r'\bbengaluru\b', r'\bbangalore\b',
        r'\bmumbai\b', r'\bbombay\b',
        r'\bchennai\b', r'\bmadras\b',
        r'\bhyderabad\b',
        r'\bpune\b',
        r'\bkolkata\b', r'\bcalcutta\b',
        r'\bahmedabad\b',
        r'\bjaipur\b',
        r'\blucknow\b',
        r'\bkochi\b', r'\bcochin\b',
        r'\bnoida\b', r'\bgurgaon\b', r'\bgurugram\b',
        r'\bchandigarh\b',
        r'\bcoimbatore\b',
        r'\bthiruvananthapuram\b', r'\btrivandrum\b',
        r'\bvisakhapatnam\b', r'\bvizag\b',
        r'\bnagpur\b',
        r'\bindore\b',
        r'\bbhopal\b',
        r'\bpatna\b',
        r'\bsurat\b',
        r'\bvadodara\b',
    ]

    # Indian companies (major IT, conglomerates, AI startups)
    INDIAN_COMPANIES = [
        # Major IT Services
        r'\btcs\b', r'\btata\s*consultancy\b',
        r'\binfosys\b',
        r'\bwipro\b',
        r'\bhcl\s*tech\b', r'\bhcltech\b',
        r'\btech\s*mahindra\b',
        r'\bmindtree\b', r'\bltimindtree\b',
        r'\bmphasis\b',
        r'\bpersistent\b',
        r'\bcoforge\b',
        r'\bzensar\b',
        r'\bcyient\b',
        # Conglomerates
        r'\btata\b',
        r'\breliance\b', r'\bjio\b',
        r'\badani\b',
        r'\bmahindra\b',
        r'\bbirla\b',
        r'\bbajaj\b',
        r'\bgodrej\b',
        # AI Startups
        r'\bsarvam\s*ai\b', r'\bsarvam\b',
        r'\bkrutrim\b',
        r'\bqure\.?ai\b',
        r'\bniramai\b',
        r'\bsigtuple\b',
        r'\bwadhwani\s*ai\b',
        r'\byellow\.?ai\b',
        r'\bhaptik\b',
        r'\bvernacular\.?ai\b',
        r'\bgupshup\b',
        r'\bleena\s*ai\b',
        r'\bdarwinbox\b',
        r'\bmindtickle\b',
        r'\bfractal\b',
        r'\bmu\s*sigma\b',
        r'\bquantiphi\b',
        r'\btiger\s*analytics\b',
        r'\blatentview\b',
        # Other major Indian companies
        r'\bzoho\b',
        r'\bfreshworks\b',
        r'\bbrowserstack\b',
        r'\brazorpay\b',
        r'\bphonepe\b',
        r'\bpaytm\b',
        r'\bflipkart\b',
        r'\bzomato\b',
        r'\bswiggy\b',
        r'\bola\s*(?:electric|cabs)?\b',
        r'\bbyju\b',
        r'\bunacademy\b',
    ]

    # Indian government and institutions
    INDIAN_GOVT_INSTITUTIONS = [
        # Central Government
        r'\bmeity\b', r'\bministry\s*of\s*electronics\b',
        r'\bniti\s*aayog\b',
        r'\bdigital\s*india\b',
        r'\bmake\s*in\s*india\b',
        r'\bstartup\s*india\b',
        r'\bindiaai\s*mission\b', r'\bindia\s*ai\s*mission\b',
        r'\bpib\b', r'\bpress\s*information\s*bureau\b',
        r'\bcentral\s*government\b',
        r'\bunion\s*government\b',
        r'\bgovernment\s*of\s*india\b',
        r'\bpm\s*modi\b', r'\bprime\s*minister\s*modi\b',
        r'\blok\s*sabha\b', r'\brajya\s*sabha\b',
        r'\bunion\s*budget\b',
        # Research Institutions
        r'\biit\b', r'\biit[a-z]+\b',  # IIT, IITMadras, etc.
        r'\biiit\b', r'\biiit[a-z]+\b',
        r'\biisc\b',
        r'\bisro\b',
        r'\bdrdo\b',
        r'\bcsir\b',
        r'\bicar\b',
        r'\bicmr\b',
        r'\bnasscom\b',
        r'\bcii\b',
        r'\bficci\b',
        # State govt patterns
        r'\b(?:karnataka|maharashtra|telangana|tamil\s*nadu|kerala|delhi|andhra)\s*(?:govt|government|cabinet|cm|chief\s*minister)\b',
    ]

    # =========================================================================
    # DEFINITE DROP: Non-India subjects
    # =========================================================================

    NON_INDIA_SIGNALS = [
        # Foreign countries as primary subject (without India)
        r'\b(?:us|u\.s\.|united\s*states|american)\s+(?:government|congress|senate|regulation|policy)\b',
        r'\b(?:eu|european\s*union|europe)\s+(?:regulation|policy|law|act)\b',
        r'\b(?:china|chinese)\s+(?:government|regulation|tech|company)\b',
        r'\b(?:japan|japanese)\s+(?:government|tech|company)\b',
        r'\b(?:uk|british|britain)\s+(?:government|regulation)\b',
        # Global company internal news (without India context)
        r'\b(?:openai|anthropic|google|microsoft|meta|nvidia)\s+(?:ceo|cto|layoffs?|earnings?|revenue|stock|ipo)\b',
        # Explicitly non-India
        r'\bsilicon\s*valley\b(?!.*india)',
        r'\bwall\s*street\b',
        r'\bnasdaq\b(?!.*india)',
        r'\bnyse\b',
    ]

    # =========================================================================
    # CONTENT INDIA SUBSTANCE SIGNALS
    # =========================================================================

    INDIA_SUBSTANCE_TERMS = [
        r'\bindian\s+(?:market|companies|startups?|firms?|enterprises?)\b',
        r'\bin\s+india\b',
        r'\bacross\s+india\b',
        r'\bthroughout\s+india\b',
        r'\bindian\s+(?:developers?|engineers?|talent|workforce)\b',
        r'\b(?:rupees?|rs\.?|inr|₹)\s*\d+\s*(?:crore|lakh|million|billion)?\b',
        r'\bindian\s+(?:economy|gdp|growth)\b',
        r'\bdomestic\s+(?:market|companies)\b.*india',
    ]

    def __init__(self):
        """Initialize validator with compiled patterns."""
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile all regex patterns for performance."""
        # Title patterns
        self.india_direct_patterns = [re.compile(p, re.I) for p in self.INDIA_DIRECT_SIGNALS]
        self.state_city_patterns = [re.compile(p, re.I) for p in self.INDIAN_STATES_CITIES]
        self.company_patterns = [re.compile(p, re.I) for p in self.INDIAN_COMPANIES]
        self.govt_patterns = [re.compile(p, re.I) for p in self.INDIAN_GOVT_INSTITUTIONS]

        # Drop patterns
        self.non_india_patterns = [re.compile(p, re.I) for p in self.NON_INDIA_SIGNALS]

        # Substance patterns
        self.substance_patterns = [re.compile(p, re.I) for p in self.INDIA_SUBSTANCE_TERMS]

    def validate(self, title: str, content: str = "") -> IndiaValidationResult:
        """
        Validate that India is materially discussed in the article.

        Args:
            title: Article title
            content: Article content (body text)

        Returns:
            IndiaValidationResult with decision and audit trail
        """
        title = title or ""
        content = content or ""
        text = f"{title} {content[:2000]}"
        matched_patterns = []
        india_score = 0

        # STEP 1: Check title for strong India signal → DEFINITE PASS
        title_lower = title.lower()

        # Direct India mention in title
        for pattern in self.india_direct_patterns:
            if pattern.search(title):
                matched_patterns.append(f"TITLE_INDIA:{pattern.pattern[:30]}")
                return IndiaValidationResult(
                    passed=True,
                    reason='TITLE_INDIA_DIRECT',
                    india_score=90,
                    matched_patterns=matched_patterns,
                    confidence='high'
                )

        # Indian state/city in title
        for pattern in self.state_city_patterns:
            if pattern.search(title):
                matched_patterns.append(f"TITLE_LOCATION:{pattern.pattern[:30]}")
                return IndiaValidationResult(
                    passed=True,
                    reason='TITLE_INDIA_LOCATION',
                    india_score=85,
                    matched_patterns=matched_patterns,
                    confidence='high'
                )

        # Indian company in title
        for pattern in self.company_patterns:
            if pattern.search(title):
                matched_patterns.append(f"TITLE_COMPANY:{pattern.pattern[:30]}")
                return IndiaValidationResult(
                    passed=True,
                    reason='TITLE_INDIAN_COMPANY',
                    india_score=85,
                    matched_patterns=matched_patterns,
                    confidence='high'
                )

        # Indian govt/institution in title
        for pattern in self.govt_patterns:
            if pattern.search(title):
                matched_patterns.append(f"TITLE_GOVT:{pattern.pattern[:30]}")
                return IndiaValidationResult(
                    passed=True,
                    reason='TITLE_INDIAN_GOVT',
                    india_score=90,
                    matched_patterns=matched_patterns,
                    confidence='high'
                )

        # STEP 2: Check for definite non-India subject → DEFINITE DROP
        # Only drop if no India signals at all in text
        has_any_india = self._has_any_india_signal(text)

        if not has_any_india:
            for pattern in self.non_india_patterns:
                if pattern.search(title):
                    return IndiaValidationResult(
                        passed=False,
                        reason='NON_INDIA_SUBJECT',
                        india_score=0,
                        matched_patterns=[f"NON_INDIA:{pattern.pattern[:40]}"],
                        confidence='high'
                    )

        # STEP 3: Check content for India substance
        # Count India signals in content
        india_signal_count = 0

        for pattern in self.india_direct_patterns:
            if pattern.search(content):
                india_signal_count += 1
                matched_patterns.append(f"CONTENT_INDIA:{pattern.pattern[:30]}")
                india_score += 30

        for pattern in self.state_city_patterns:
            if pattern.search(content):
                india_signal_count += 1
                matched_patterns.append(f"CONTENT_LOCATION:{pattern.pattern[:30]}")
                india_score += 25

        for pattern in self.company_patterns:
            if pattern.search(content):
                india_signal_count += 1
                matched_patterns.append(f"CONTENT_COMPANY:{pattern.pattern[:30]}")
                india_score += 25

        for pattern in self.govt_patterns:
            if pattern.search(content):
                india_signal_count += 1
                matched_patterns.append(f"CONTENT_GOVT:{pattern.pattern[:30]}")
                india_score += 30

        for pattern in self.substance_patterns:
            if pattern.search(text):
                india_signal_count += 1
                matched_patterns.append(f"SUBSTANCE:{pattern.pattern[:30]}")
                india_score += 20

        # If strong content signals, pass
        if india_signal_count >= 2 and india_score >= 50:
            return IndiaValidationResult(
                passed=True,
                reason='CONTENT_INDIA_SUBSTANCE',
                india_score=min(india_score, 85),
                matched_patterns=matched_patterns[:5],
                confidence='medium'
            )

        # STEP 4: Borderline case - use LLM
        if india_signal_count >= 1:
            llm_result = self._llm_verify(title, content[:500])
            return IndiaValidationResult(
                passed=llm_result['is_india'],
                reason=f"LLM_VERIFIED:{llm_result['classification']}",
                india_score=60 if llm_result['is_india'] else 10,
                matched_patterns=matched_patterns[:5],
                llm_used=True,
                confidence='borderline'
            )

        # STEP 5: No India signals found → DROP
        return IndiaValidationResult(
            passed=False,
            reason='NO_INDIA_SIGNAL',
            india_score=0,
            matched_patterns=[],
            confidence='high'
        )

    def _has_any_india_signal(self, text: str) -> bool:
        """Check if text has any India signal at all."""
        for pattern in self.india_direct_patterns:
            if pattern.search(text):
                return True
        for pattern in self.state_city_patterns:
            if pattern.search(text):
                return True
        for pattern in self.company_patterns:
            if pattern.search(text):
                return True
        for pattern in self.govt_patterns:
            if pattern.search(text):
                return True
        return False

    def _llm_verify(self, title: str, content: str) -> Dict[str, Any]:
        """
        Use LLM to verify if India is the subject.

        Args:
            title: Article title
            content: First 500 chars of content

        Returns:
            Dict with is_india (bool) and classification (str)
        """
        import os

        try:
            from groq import Groq

            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                # No API key - conservative DROP for India validation
                return {'is_india': False, 'classification': 'NO_API_KEY_DROP'}

            client = Groq(api_key=api_key)

            prompt = f"""Is this article about India, relevant to India, or about an Indian company/institution?

Title: {title}
Content preview: {content}

Answer with ONE word: INDIA, NOT_INDIA, or UNCLEAR

- INDIA: Article is about India, Indian companies, Indian govt, events in India, or directly relevant to India
- NOT_INDIA: Article is about foreign companies/govts/events without India connection
- UNCLEAR: Cannot determine"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=10
            )

            answer = response.choices[0].message.content.strip().upper()

            if 'INDIA' in answer and 'NOT' not in answer:
                classification = 'INDIA'
            elif 'NOT' in answer or 'UNCLEAR' in answer:
                classification = 'NOT_INDIA'
            else:
                classification = answer[:20]

            return {
                'is_india': classification == 'INDIA',
                'classification': classification
            }
        except Exception as e:
            # On LLM failure, conservative DROP for India validation
            return {'is_india': False, 'classification': f'LLM_ERROR_DROP:{str(e)[:20]}'}

    def filter_article(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter a single article - compatibility method for orchestrator.

        Args:
            article: Dict with 'title' and 'content' keys

        Returns:
            Dict with validation results
        """
        title = article.get('title', '')
        content = article.get('content', '')

        result = self.validate(title, content)

        return {
            'passed': result.passed,
            'india_score': result.india_score,
            'confidence': result.confidence,
            'llm_verified': result.llm_used,
            'india_matches': result.matched_patterns[:5],
            'breakdown': {
                'reason': result.reason,
                'llm_used': result.llm_used,
                'patterns_matched': len(result.matched_patterns)
            }
        }


def test_validator():
    """Test the India Subject Validator with sample articles."""
    validator = IndiaSubjectValidator()

    test_cases = [
        # MUST PASS - India-relevant
        ("TCS launches AI platform for enterprises", "", True),
        ("IIT Madras researchers develop new NLP model", "", True),
        ("Karnataka government announces AI policy", "", True),
        ("Google expands AI team in Bangalore", "", True),
        ("Sarvam AI raises $50M Series B funding", "", True),
        ("India's GenAI market to reach $17B by 2030", "", True),
        ("MeitY releases AI governance framework", "", True),
        ("Microsoft opens AI centre in Hyderabad", "", True),

        # MUST DROP - Not India-relevant
        ("ChatGPT down globally, users report widespread issues", "", False),
        ("OpenAI CEO Altman discusses AGI timeline", "", False),
        ("Anthropic releases Claude 4 with improved reasoning", "", False),
        ("US Senate debates AI regulation bill", "", False),
        ("NVIDIA earnings beat Wall Street estimates", "", False),
        ("Roblox launches AI tech for 3D models", "", False),
    ]

    print("\n" + "=" * 70)
    print("INDIA SUBJECT VALIDATOR TEST")
    print("=" * 70 + "\n")

    passed_tests = 0
    failed_tests = 0

    for title, content, expected_pass in test_cases:
        result = validator.validate(title, content)
        test_passed = result.passed == expected_pass

        if test_passed:
            passed_tests += 1
            status = "PASS"
        else:
            failed_tests += 1
            status = "FAIL"

        print(f"{'OK' if test_passed else 'XX'} {status}: {title[:50]}...")
        print(f"    Expected: {'PASS' if expected_pass else 'DROP'}, Got: {'PASS' if result.passed else 'DROP'}")
        print(f"    Reason: {result.reason}")
        print()

    print("=" * 70)
    print(f"Results: {passed_tests} passed, {failed_tests} failed")
    print("=" * 70)


if __name__ == "__main__":
    test_validator()
