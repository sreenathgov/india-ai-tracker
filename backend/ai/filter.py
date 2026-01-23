"""
AI Relevance Filter - STRICT WEIGHTED SCORING SYSTEM

An item may be ingested if and only if:
1. AI is the PRIMARY SUBJECT/OBJECT of the article (not tangential mention)
2. It has a STRONG India connection (weighted scoring)

CRITICAL RULE: The article must be PRIMARILY/FUNDAMENTALLY about AI.
- If AI is mentioned only in passing, or as part of a broader topic, REJECT
- If the main subject is labor, finance, hiring, policy (non-AI), REJECT even if AI is mentioned
- The PRIMARY subject matter must be AI technology, AI products, AI policy, or AI investments

INDIA RELEVANCE SCORING (minimum 40 points required):
- Tier 1 (50 pts): Headline directly mentions India, Indian state, or Indian city
- Tier 2 (40 pts): Headline mentions Indian company OR India division of global company
- Tier 3 (30 pts): Content mentions India/state/city with substantive context
- Tier 4 (20 pts): Indian company mentioned only in content
- Tier 5 (10 pts): Weak/tangential India reference

Global AI news without strong India connection should be REJECTED.
Prefer false negatives over false positives.
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from groq import Groq


class AIFilter:
    """Strict AI relevance filter with weighted India scoring."""

    # ==================== AI KEYWORDS ====================

    # Strong AI signals - must appear for consideration
    # NOTE: \bai\b is dangerous - matches "AIM" (Analytics India Mag), "said", partial words
    # We use more specific patterns to avoid false positives
    STRONG_AI_KEYWORDS = [
        r'(?<![a-z])\bai\b(?![a-z])',  # AI as standalone word, not part of AIM, SAID, etc.
        r'\bA\.I\.\b',  # A.I. with periods
        r'\bA\.I\b',  # A.I without trailing period
        r'\bai[\-_]?(?:powered|driven|enabled|based|first|native|led|focused)\b',  # AI-powered, AI-driven, etc.
        r'\bgenai\b',  # GenAI as one word
        r'\bgen[\-\s]?ai\b',  # Gen AI, Gen-AI
        r'\bai\s?\d+\b',  # AI100, AI 100, AI50, etc. (accelerator cohorts)
        r'ai100',  # AI100 specifically (no word boundary needed)
        r'\bartificial intelligence\b',
        r'\bmachine learning\b',
        r'\bml\s+model',  # ML model
        r'\bdeep learning\b',
        r'\bneural network',
        r'\bllm\b',
        r'\bllms\b',
        r'\blarge language model',
        r'\bgenerative ai\b',
        r'\bgen ai\b',
        r'\bgpt[\-\s]?\d*\b',  # GPT, GPT-4, GPT4
        r'\bchatgpt\b',
        r'\bgemini\b',
        r'\bclaude\b',
        r'\bopenai\b',
        r'\banthopic\b',
        r'\banthropic\b',
        r'\bfoundation model',
        r'\bai model',
        r'\bai agent',
        r'\bagentic\b',  # Agentic AI
        r'\bai chip',
        r'\bai compute',
        r'\bai infrastructure',
        r'\bai policy',
        r'\bai policies\b',
        r'\bai governance',
        r'\bai regulation',
        r'\bai startup',
        r'\bai startups\b',
        r'\bai hub',
        r'\bai centre\b',
        r'\bai center\b',
        r'\bcomputer vision\b',
        r'\bnatural language processing\b',
        r'\bnlp\b',
        r'\breinforcement learning\b',
        r'\btransformer model',
        r'\bai ethics\b',
        r'\bai safety\b',
        r'\bcopilot\b',
        r'\bco-pilot\b',
        r'\bmistral ai\b',  # Mistral AI specifically (to avoid AXISCADES Mistral)
        r'\bhugging\s*face\b',
        r'\bstable diffusion\b',
        r'\bmidjourney\b',
        r'\bdall-?e\b',
        r'\bvoice ai\b',
        r'\bconversational ai\b',
        r'\bchatbot\b',
        r'\bai assistant\b',
        r'\bai tool',
        r'\bai platform',
        r'\bai solution',
        r'\bai application',
        r'\bai adoption\b',
        r'\bai investment',
        r'\bai funding\b',
        r'\bai research\b',
        r'\bai lab\b',
        r'\bai labs\b',
        r'\bperplexity\b',
        r'\bdeepseek\b',
        r'\bxai\b',
        r'\bgrok\b',
        r'\bsora\b',
        r'\bai-\w+\b',  # AI-anything hyphenated
        r'\belevenlabs?\b',  # ElevenLabs voice AI
        r'\bai\s+voice\b',
        r'\btext[\-\s]to[\-\s]speech\b',
        r'\btts\b',
        r'\bspeech[\-\s]synthesis\b',
    ]

    # Context-dependent keywords (need AI context)
    CONTEXT_DEPENDENT_KEYWORDS = [
        r'\bsemiconductor',
        r'\bchip\b',
        r'\bgpu\b',
        r'\bnvidia\b',
        r'\bdata center\b',
        r'\bdata centre\b',
        r'\bdatacenter\b',
        r'\bdatacentre\b',
        r'\bhyperscale\b',
        r'\bcolocation\b',
        r'\bco-location\b',
        r'\bcloud computing\b',
        r'\bedge computing\b',
        r'\bhigh performance computing\b',
        r'\bhpc\b',
        r'\bcompute infrastructure\b',
        r'\bgpu cluster\b',
        r'\bai compute\b',
        r'\bai infrastructure\b',
        r'\bdata park\b',
        r'\bserver farm\b',
    ]

    # Disqualifying patterns - reject these unless AI is the PRIMARY topic
    # These patterns indicate IT industry/financial news, NOT AI news
    DISQUALIFYING_PATTERNS = [
        r'\blayoffs?\b(?!.*\b(?:ai|artificial intelligence)\b)',
        r'\bjob cuts?\b(?!.*\b(?:ai|artificial intelligence)\b)',
        r'\bdownsiz',
        r'\bretrench',
        r'\bipo\b(?!.*\b(?:ai|artificial intelligence)\b)',  # IPO news without AI context
        r'\bstock\s*split\b',
        r'\bdividend\b',
        # Quarterly results / financial news - not AI-relevant unless AI is the focus
        # These patterns require specific financial reporting context
        r'\bq[1-4]\s*(?:fy)?\d{2,4}?\s*(?:results?|earnings?|profit|revenue|net\s*income)\b',
        r'\bquarterly\s*(?:results?|earnings?|profit|revenue)\b',
        r'\bprofit\s*(?:falls?|drops?|rises?|grows?|declines?)\s+\d+%?\s*(?:yoy|year[\-\s]over[\-\s]year)\b',
        r'\bnet\s*profit\s*(?:falls?|drops?|rises?|grows?)\s+\d+%',
        r'\bmargin\s*(?:expansion|contraction)\b',
        r'\battrition\b.*\b(?:rate|eases?|drops?|rises?)\b',
        r'\blabour\s*code\b',
        r'\blabor\s*code\b',
        r'\bemployee\s*(?:count|headcount|strength)\s*(?:falls?|rises?|grows?)\b',
        r'\badds?\s+\d{3,}\s*employees?\b',  # "adds 6,529 employees" but not "adds 10 AI engineers"
        r'\bhiring\s*(?:freeze|slowdown)\b',
        r'\bfresher\s*(?:hiring|onboarding|delay|postpone)\b(?!.*\b(?:ai|artificial intelligence)\b)',
        # Life sciences / pharma / non-AI topics that often mention AI tangentially
        r'\blife\s*sciences?\s*policy\b(?!.*\b(?:ai|artificial intelligence)\s)',  # Life sciences policies that just mention AI as one of many areas
        r'\bpharma\s*(?:village|park|hub)\b(?!.*\b(?:ai|artificial intelligence)\s)',
        # Beauty / cosmetics / non-tech that uses "tech" loosely
        r'\bbeauty\s*tech\b(?!.*\b(?:ai|artificial intelligence)\b)',
        r'\bcosmetic\b',
    ]

    # FALSE POSITIVE PATTERNS - these look like AI but are NOT
    # These get special handling to prevent mismatches
    FALSE_POSITIVE_PATTERNS = [
        r'\bspeaking\s+to\s+aim\b',  # "Speaking to AIM" (Analytics India Magazine)
        r'\btold\s+aim\b',  # "told AIM"
        r'\baccording\s+to\s+aim\b',
        r'\baim\s+reported\b',
        r'\baim\s+said\b',
        r'\bl\'?oreal\b',  # L'Oréal beauty company
        r'\bloreal\b',
    ]

    # ==================== INDIA INDICATORS (TIERED) ====================

    # Tier 1: Country and geographic names (highest weight in headlines)
    TIER1_COUNTRY = [
        r'\bindia\b', r'\bindian\b', r'\bbharat\b',
    ]

    TIER1_STATES = [
        r'\btamil nadu\b', r'\btamilnadu\b', r'\btn\b(?=\s+(?:government|govt|cm|chief minister|state))',  # TN with govt context
        r'\bkarnataka\b', r'\bka\b(?=\s+(?:government|govt|cm|chief minister|state))',
        r'\bmaharashtra\b', r'\bmh\b(?=\s+(?:government|govt|cm|chief minister|state))',
        r'\btelangana\b', r'\btg\b(?=\s+(?:government|govt|cm|chief minister|state))',
        r'\bandhra pradesh\b', r'\bap\b(?=\s+(?:government|govt|cm|chief minister|state))',
        r'\bkerala\b', r'\bwest bengal\b', r'\bgujarat\b',
        r'\brajasthan\b', r'\buttar pradesh\b', r'\bpunjab\b', r'\bharyana\b',
        r'\bmadhya pradesh\b', r'\bodisha\b', r'\borissa\b', r'\bbihar\b',
        r'\bjharkhand\b', r'\bchhattisgarh\b', r'\bassam\b', r'\bgoa\b',
        r'\bhimachal pradesh\b', r'\buttarakhand\b', r'\bjammu\b', r'\bkashmir\b',
    ]

    TIER1_CITIES = [
        r'\bmumbai\b', r'\bdelhi\b', r'\bnew delhi\b', r'\bbengaluru\b', r'\bbangalore\b',
        r'\bhyderabad\b', r'\bchennai\b', r'\bpune\b', r'\bkolkata\b', r'\bcalcutta\b',
        r'\bahmedabad\b', r'\bjaipur\b', r'\bgurgaon\b', r'\bgurugram\b',
        r'\bnoida\b', r'\bcoimbatore\b', r'\bkochi\b', r'\bcochin\b',
        r'\bthiruvananthapuram\b', r'\btrivandrum\b', r'\blucknow\b', r'\bkanpur\b',
        r'\bnagpur\b', r'\bindore\b', r'\bbhopal\b', r'\bpatna\b', r'\bsurat\b',
        r'\bvadodara\b', r'\bvisakhapatnam\b', r'\bvizag\b', r'\bvijayawada\b',
        r'\bmadurai\b', r'\btrichy\b', r'\bmysore\b', r'\bmysuru\b', r'\bmangalore\b',
        r'\bmangaluru\b', r'\bchandigarh\b', r'\bsecunderabad\b', r'\bthane\b',
    ]

    # Tier 2: Indian companies (strong India signal)
    TIER2_INDIAN_COMPANIES = [
        # Major startup incubators/accelerators (get Tier 2 weight)
        r'\bt-hub\b', r'\bthub\b', r'\bt hub\b',  # Telangana's startup hub
        r'\bnasscom\b',  # Move to Tier 2 for higher weight
        # Major IT/Tech
        r'\btcs\b', r'\btata consultancy\b', r'\binfosys\b', r'\bwipro\b',
        r'\bhcl\s*tech', r'\bhcltech\b', r'\btech mahindra\b', r'\bl&t\s*infotech\b', r'\bmindtree\b',
        r'\bmphasis\b', r'\bcoforge\b', r'\bpersistent\b', r'\bltimindtree\b',
        r'\bcyient\b', r'\bzensar\b', r'\bhexaware\b', r'\bbirlasoft\b',
        r'\btredence\b', r'\baxiscades\b', r'\bsonata software\b', r'\bmastek\b',
        r'\blarsen\b', r'\bl&t\b',
        # Conglomerates
        r'\btata\b', r'\breliance\b', r'\bmahindra\b', r'\badani\b', r'\bbharti\b',
        r'\bvedanta\b', r'\baditya birla\b', r'\bgodrej\b', r'\bhero\b',
        # Startups/Unicorns
        r'\bflipkart\b', r'\bzomato\b', r'\bswiggy\b', r'\bpaytm\b', r'\bzerodha\b',
        r'\brazerp?pay\b', r'\brazorpay\b', r'\bphonepe\b', r'\bbyjus?\b', r'\bunacademy\b',
        r'\bupgrad\b', r'\bmeesho\b', r'\bdream11\b', r'\bcred\b', r'\brupay\b',
        r'\bfresher\s*works\b', r'\bzoho\b', r'\bpostman\b', r'\bbrowserstack\b',
        r'\bchargebee\b', r'\bdruva\b', r'\bicertis\b', r'\bhighradius\b',
        r'\bhasura\b', r'\bglean\b.*india', r'\bfractal\b', r'\bfractal analytics\b',
        r'\bshadowfax\b', r'\bola\b', r'\bola electric\b', r'\brapido\b',
        r'\bdelhivery\b', r'\bdunzo\b', r'\burban company\b', r'\bpracto\b',
        r'\blenskart\b', r'\bnykaa\b', r'\bfirstcry\b', r'\bpolicy\s*bazaar\b',
        r'\bcarwale\b', r'\bcars24\b', r'\bspinny\b', r'\bcashfree\b',
        r'\bunbox robotics\b', r'\bupliance\b', r'\bstaqu\b',
        # Telecom
        r'\bjio\b', r'\bairtel\b', r'\bvi\b(?=.*india|\s*telecom)', r'\bbsnl\b',
        # Banks with tech focus
        r'\bhdfc\b', r'\bicici\b', r'\baxis\b(?=.*bank)', r'\bkotak\b',
        # AI-specific Indian companies
        r'\bkrutrim\b', r'\bsarvam\b', r'\bwadhwani\b', r'\bqure\.?ai\b',
        r'\bniramai\b', r'\bsigTuple\b', r'\bsig\s*tuple\b', r'\bmad street den\b', r'\bvue\.?ai\b',
        r'\b2care\.?ai\b', r'\bshunya labs\b', r'\btagbin\b', r'\bcrispr\s*bits\b',
        r'\barya\.?ag\b', r'\bneysa\b', r'\bflocareer\b', r'\bspeakx\b',
        r'\barctus\b', r'\bmirana\b', r'\bfyno\b', r'\bfurlenco\b',
        r'\bwhizzo\b', r'\blightspeed photonics\b',
        # Sports/Entertainment with tech
        r'\brcb\b', r'\bipl\b',
    ]

    # Tier 2: Global companies with India-specific mention
    TIER2_GLOBAL_INDIA = [
        r'\bgoogle\s*india\b', r'\bmicrosoft\s*india\b', r'\bamazon\s*india\b',
        r'\bmeta\s*india\b', r'\bfacebook\s*india\b', r'\bapple\s*india\b',
        r'\bibm\s*india\b', r'\boracle\s*india\b', r'\bsalesforce\s*india\b',
        r'\badobe\s*india\b', r'\bnvidia\s*india\b', r'\bintel\s*india\b',
        r'\bqualcomm\s*india\b', r'\bsamsung\s*india\b', r'\bdell\s*india\b',
        r'\bhp\s*india\b', r'\bcisco\s*india\b', r'\baws\s*india\b',
        r'\bazure\s*india\b', r'\bgcp\s*india\b',
        # R&D centers
        r'india\s*r&d', r'india\s*research', r'india\s*development\s*cent',
        r'india\s*tech\s*hub', r'india\s*innovation',
    ]

    # Tier 3: Indian institutions and government
    TIER3_INSTITUTIONS = [
        # IITs
        r'\biit\b', r'\biit-?[a-z]+\b',
        # IIMs, IISc, etc
        r'\biisc\b', r'\biim\b', r'\biim-?[a-z]+\b', r'\biiser\b', r'\bnit\b',
        r'\bits\s*pilani\b', r'\bbits\b',
        # Research
        r'\bisro\b', r'\bdrdo\b', r'\bcsir\b', r'\btifr\b', r'\bbarc\b',
        # Industry bodies
        r'\bnasscom\b', r'\bficci\b', r'\bcii\b(?=.*india)', r'\bassocham\b',
        # Startup incubators/accelerators (major institutions)
        r'\bistart\b', r'\bi-start\b',  # Rajasthan
        r'\bstartup\s*(?:india|karnataka|tn|telangana|maharashtra|gujarat)\b',
        # Government
        r'\bniti aayog\b', r'\bmeity\b', r'\bpib\b', r'\bdigital india\b',
        r'\bstartup india\b', r'\bmake in india\b', r'\baatmanirbhar\b',
        r'\bcentral government\b', r'\bunion government\b', r'\bgovernment of india\b',
        r'\bprime minister\b.*(?:modi|india)', r'\bchief minister\b',
        r'\bparliament\b.*india', r'\blok sabha\b', r'\brajya sabha\b',
    ]

    # Tier 4: Indian currency and units (weak signal, needs context)
    TIER4_CURRENCY = [
        r'\b(?:rs\.?|inr|₹)\s*[\d,]+', r'\bcrore\b', r'\blakh\b', r'\brupee',
    ]

    # Minimum India score required for acceptance
    MIN_INDIA_SCORE = 40

    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=api_key) if api_key else None
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile all regex patterns for performance."""
        self.strong_ai_patterns = [re.compile(p, re.IGNORECASE) for p in self.STRONG_AI_KEYWORDS]
        self.context_patterns = [re.compile(p, re.IGNORECASE) for p in self.CONTEXT_DEPENDENT_KEYWORDS]
        self.disqualify_patterns = [re.compile(p, re.IGNORECASE) for p in self.DISQUALIFYING_PATTERNS]
        self.false_positive_patterns = [re.compile(p, re.IGNORECASE) for p in self.FALSE_POSITIVE_PATTERNS]

        # India patterns by tier
        self.tier1_country = [re.compile(p, re.IGNORECASE) for p in self.TIER1_COUNTRY]
        self.tier1_states = [re.compile(p, re.IGNORECASE) for p in self.TIER1_STATES]
        self.tier1_cities = [re.compile(p, re.IGNORECASE) for p in self.TIER1_CITIES]
        self.tier2_companies = [re.compile(p, re.IGNORECASE) for p in self.TIER2_INDIAN_COMPANIES]
        self.tier2_global = [re.compile(p, re.IGNORECASE) for p in self.TIER2_GLOBAL_INDIA]
        self.tier3_institutions = [re.compile(p, re.IGNORECASE) for p in self.TIER3_INSTITUTIONS]
        self.tier4_currency = [re.compile(p, re.IGNORECASE) for p in self.TIER4_CURRENCY]

    # Known AI companies - articles about these are inherently AI-relevant
    KNOWN_AI_COMPANIES = [
        r'\bkrutrim\b',
        r'\bsarvam\s*ai\b', r'\bsarvam\b',
        r'\bqure\.?ai\b', r'\bqure\s*ai\b',
        r'\bniramai\b',
        r'\bsigtuple\b', r'\bsig\s*tuple\b',
        r'\bmad\s*street\s*den\b', r'\bvue\.?ai\b',
        r'\bwadhwani\s*ai\b',
        r'\bhaptik\b',
        r'\byellow\.?ai\b',
        r'\bgupshup\b',
        r'\bleena\s*ai\b',
        r'\bactive\.?ai\b',
        r'\bstarbuzz\.?ai\b',
        r'\b\w+\.ai\b',  # Any company ending in .ai
    ]

    def _has_false_positive(self, text):
        """Check if text contains known false positive patterns (e.g., AIM magazine)."""
        for pattern in self.false_positive_patterns:
            if pattern.search(text):
                return True
        return False

    def _is_known_ai_company(self, text):
        """Check if text mentions a known AI company (inherently AI-relevant)."""
        text_lower = text.lower()
        for pattern in self.KNOWN_AI_COMPANIES:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        return False

    def _has_strong_ai_signal(self, text):
        """Check if text contains strong AI keywords."""
        for pattern in self.strong_ai_patterns:
            if pattern.search(text):
                return True
        return False

    def _has_context_dependent_keyword(self, text):
        """Check if text contains keywords that need AI context."""
        for pattern in self.context_patterns:
            if pattern.search(text):
                return True
        return False

    def _is_disqualified(self, text):
        """Check if text contains disqualifying patterns."""
        for pattern in self.disqualify_patterns:
            if pattern.search(text):
                return True
        return False

    def _calculate_india_score(self, title, content):
        """
        Calculate weighted India relevance score.

        Scoring:
        - Tier 1 in headline: 50 points (India/state/city directly mentioned)
        - Tier 2 in headline: 40 points (Indian company or global India division)
        - Tier 1 in content: 30 points
        - Tier 2 in content: 25 points
        - Tier 3 (institutions): 20 points headline, 15 points content
        - Tier 4 (currency): 10 points

        Returns: (score, explanation)
        """
        score = 0
        signals = []

        title_lower = title.lower()
        content_lower = (content[:1500] if content else "").lower()

        # Tier 1: Country/State/City in HEADLINE (50 points)
        for pattern in self.tier1_country + self.tier1_states + self.tier1_cities:
            if pattern.search(title_lower):
                score += 50
                match = pattern.search(title_lower).group()
                signals.append(f"T1-headline:{match}")
                break  # Only count once for tier 1

        # Tier 2: Indian companies in HEADLINE (40 points)
        if score < 50:  # Only if tier 1 not found
            for pattern in self.tier2_companies:
                if pattern.search(title_lower):
                    score += 40
                    match = pattern.search(title_lower).group()
                    signals.append(f"T2-company:{match}")
                    break

        # Tier 2: Global company + India in HEADLINE (40 points)
        if score < 40:
            for pattern in self.tier2_global:
                if pattern.search(title_lower):
                    score += 40
                    match = pattern.search(title_lower).group()
                    signals.append(f"T2-global-india:{match}")
                    break

        # Tier 3: Institutions in HEADLINE (20 points)
        for pattern in self.tier3_institutions:
            if pattern.search(title_lower):
                score += 20
                match = pattern.search(title_lower).group()
                signals.append(f"T3-inst-headline:{match}")
                break

        # Now check CONTENT for additional signals
        # Tier 1 in content: 30 points
        for pattern in self.tier1_country + self.tier1_states + self.tier1_cities:
            if pattern.search(content_lower):
                if score < 50:  # Don't double count if already in headline
                    score += 30
                    match = pattern.search(content_lower).group()
                    signals.append(f"T1-content:{match}")
                    break

        # Tier 2: Indian companies in CONTENT (25 points)
        for pattern in self.tier2_companies:
            if pattern.search(content_lower):
                if "T2-company" not in str(signals):
                    score += 25
                    match = pattern.search(content_lower).group()
                    signals.append(f"T2-content:{match}")
                    break

        # Tier 3: Institutions in CONTENT (15 points)
        for pattern in self.tier3_institutions:
            if pattern.search(content_lower):
                if "T3-inst" not in str(signals):
                    score += 15
                    match = pattern.search(content_lower).group()
                    signals.append(f"T3-content:{match}")
                    break

        # Tier 4: Currency (10 points, weak signal)
        for pattern in self.tier4_currency:
            if pattern.search(title_lower) or pattern.search(content_lower):
                score += 10
                signals.append("T4-currency")
                break

        return min(score, 100), signals  # Cap at 100

    def check_relevance(self, title, content=""):
        """
        Check if article is PRIMARILY about AI AND has strong India connection.

        Returns:
            tuple: (is_relevant: bool, confidence_score: float)

        Rules:
        1. Must not contain false positive patterns (AIM magazine, etc.)
        2. Must not be disqualified (financial reports, layoffs, etc.)
        3. Must have strong AI signal in title OR content
        4. Must have India score >= 40 (weighted scoring)
        5. AI must be the PRIMARY subject (verified by LLM for borderline cases)
        """
        combined_text = f"{title} {content[:500] if content else ''}"

        # Rule 1: Check for false positives (e.g., "Speaking to AIM")
        if self._has_false_positive(combined_text):
            # If we see a false positive pattern, do stricter AI check
            # Must have STRONG AI signal in TITLE to overcome
            if not self._has_strong_ai_signal(title):
                print(f"  [REJECT] False positive (AIM/other): {title[:60]}...")
                return False, 5.0

        # Rule 2: Disqualified content -> Reject
        if self._is_disqualified(combined_text):
            print(f"  [REJECT] Disqualified: {title[:60]}...")
            return False, 5.0

        # Rule 3: Must have strong AI signal in title OR prominent in content
        has_ai_signal = self._has_strong_ai_signal(title)
        ai_in_title = has_ai_signal

        # Also check content for AI signals (with higher bar - must be in first 300 chars)
        if not has_ai_signal:
            content_start = (content[:300] if content else '').lower()
            has_ai_signal = self._has_strong_ai_signal(content_start)

        if not has_ai_signal:
            # Check for context-dependent keywords
            if self._has_context_dependent_keyword(combined_text):
                is_ai, _ = self._llm_verify_ai_context(title, content)
                if not is_ai:
                    print(f"  [REJECT] No AI context: {title[:60]}...")
                    return False, 20.0
                has_ai_signal = True
            else:
                print(f"  [REJECT] No AI signal: {title[:60]}...")
                return False, 10.0

        # Rule 4: Calculate weighted India score
        india_score, signals = self._calculate_india_score(title, content)

        if india_score < self.MIN_INDIA_SCORE:
            print(f"  [REJECT] Low India score ({india_score}): {title[:60]}...")
            return False, india_score / 2  # Return half the score as confidence

        # Rule 5: CRITICAL - Verify AI is the PRIMARY subject
        # If AI is not in the title, we MUST verify it's the primary subject
        # This catches cases like "Life Sciences Policy... mentions AI as one area"
        # EXCEPTION: If the article is about a KNOWN AI COMPANY, skip this check
        # (Krutrim, Sarvam, Qure.ai, etc. are inherently AI companies)
        if not ai_in_title:
            # Check if this is about a known AI company
            is_known_ai_company = self._is_known_ai_company(combined_text)

            if not is_known_ai_company:
                is_primary, _ = self._llm_verify_primary_ai(title, content)
                if not is_primary:
                    print(f"  [REJECT] AI not primary subject: {title[:60]}...")
                    return False, 25.0

        # All checks passed -> ACCEPT
        print(f"  [ACCEPT] AI + India({india_score}, {signals}): {title[:60]}...")
        return True, min(90.0, 50 + india_score / 2)

    def _llm_verify_ai_context(self, title, content):
        """Use LLM to verify if context-dependent content is AI-related."""
        if not self.client:
            print(f"  [REJECT] No LLM: {title[:60]}...")
            return False, 15.0

        try:
            prompt = f"""You are a strict content filter for an AI news tracker focused on INDIA.

ARTICLE TITLE: {title}
ARTICLE EXCERPT: {content[:600] if content else 'No content available'}

QUESTION: Is this article SUBSTANTIVELY about artificial intelligence?

RULES:
- Answer YES only if the article is directly about AI technology, AI products, AI infrastructure for AI workloads, or AI policy.
- Semiconductor/chip news is YES only if explicitly about AI chips or AI compute.
- Data center news is YES only if explicitly for AI workloads.
- General technology, IT services, or digital transformation is NO.
- If unsure, answer NO.

Answer with ONLY "YES" or "NO"."""

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=5
            )

            result = response.choices[0].message.content.strip().upper()
            is_relevant = result.startswith('YES')

            if is_relevant:
                return True, 80.0
            else:
                return False, 20.0

        except Exception as e:
            print(f"  [REJECT] LLM error ({e}): {title[:60]}...")
            return False, 15.0

    def _llm_verify_primary_ai(self, title, content):
        """
        Use LLM to verify that AI is the PRIMARY subject of the article.

        This catches cases where:
        - AI is mentioned as one of many areas in a broader policy
        - AI is a tangential mention in a non-AI article
        - The primary subject is something else (life sciences, beauty tech, etc.)
        """
        if not self.client:
            # If no LLM, be conservative - reject borderline cases
            return False, 15.0

        try:
            prompt = f"""You are a strict content filter determining if AI is the PRIMARY subject of an article.

ARTICLE TITLE: {title}
ARTICLE EXCERPT: {content[:600] if content else 'No content available'}

QUESTION: Is Artificial Intelligence (AI) the PRIMARY, FUNDAMENTAL subject of this article?

CRITICAL RULES:
- Answer YES only if AI is the MAIN TOPIC - the article is fundamentally ABOUT AI
- Answer NO if AI is mentioned as ONE OF MANY areas or technologies (e.g., "AI, analytics, digital health")
- Answer NO if the primary subject is life sciences, pharma, beauty tech, GCC expansion, etc. even if AI is mentioned
- Answer NO if AI is mentioned only in passing or as part of a list
- Answer NO if the article is primarily about company financials, hiring, layoffs, or general tech
- Answer NO if AI appears only as "AI, analytics, data" or similar lists - AI must be the FOCUS
- The test: Would removing AI references fundamentally change what the article is about? If NO, answer NO.

Examples of NO:
- "Life Sciences Policy 2026-30... mentions AI, analytics, digital health" -> NO (primary: life sciences)
- "Beauty tech hub with AI capabilities" -> NO (primary: beauty/cosmetics)
- "GCC expansion for AI and analytics" -> NO (primary: GCC expansion, AI is one capability)
- "Company opens center for AI, data analytics, cloud" -> NO (AI is one of several)

Examples of YES:
- "Company launches AI model for healthcare" -> YES (primary: AI product)
- "Government AI policy announced" -> YES (primary: AI policy)
- "AI startup raises funding" -> YES (primary: AI company)
- "New AI chip manufacturing facility" -> YES (primary: AI infrastructure)

Answer with ONLY "YES" or "NO"."""

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=5
            )

            result = response.choices[0].message.content.strip().upper()
            is_primary = result.startswith('YES')

            if is_primary:
                return True, 85.0
            else:
                return False, 25.0

        except Exception as e:
            print(f"  [PRIMARY CHECK] LLM error ({e}): {title[:60]}...")
            # On error, be conservative
            return False, 15.0
