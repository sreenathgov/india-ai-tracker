"""
Article Categoriser Module - Priority-Ordered Decision Tree

Each accepted item must be assigned to exactly one of the following categories:
1. Events (highest priority)
2. Policies and Initiatives
3. AI Start-Up News
4. Major AI Developments (default fallback)

DESIGN PRINCIPLE: First match wins. No scoring, no tiebreaking.
Categories are mutually exclusive - once assigned, processing stops.
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)


class Categoriser:
    """
    Categorises AI articles using a strict priority-ordered decision tree.

    Priority Order:
    1. Events - Upcoming, attendable, AI-focused events
    2. Policies and Initiatives - Government-led AI initiatives
    3. AI Start-Up News - Startup funding, launches, milestones
    4. Major AI Developments - Default for everything else
    """

    # =========================================================================
    # KNOWN AI STARTUPS - Fast-track to "AI Start-Up News"
    # =========================================================================
    KNOWN_AI_STARTUPS = [
        # Indian AI Startups (Seed to Series C stage)
        r'\bsarvam\s*ai\b', r'\bsarvam\b',
        r'\bkrutrim\b',
        r'\bqure\.?ai\b', r'\bqure\s*ai\b',
        r'\bniramai\b',
        r'\bsigtuple\b', r'\bsig\s*tuple\b',
        r'\bmad\s*street\s*den\b', r'\bvue\.?ai\b',
        r'\bwadhwani\s*ai\b',
        r'\b4cast\.?ai\b',
        r'\bstaqu\b',
        r'\barya\.?ai\b', r'\barya\s*ai\b',
        r'\bneysa\b',
        r'\bfyno\b',
        r'\bspeakx\b',
        r'\bflocareer\b',
        r'\bunbox\s*robotics\b',
        r'\bupliance\b',
        r'\bhaptik\b',
        r'\bvernacular\.?ai\b',
        r'\byellow\.?ai\b',
        r'\bgupshup\b',
        r'\bactive\.?ai\b',
        r'\bmindtickle\b',
        r'\bleena\s*ai\b',
        r'\bdarwinbox\b',
        r'\bbellatrix\b',
        r'\bpixxel\b',
        r'\bagnikul\b',
        r'\bskyroot\b',
        r'\bstarbuzz\.?ai\b',
        r'\bb-secur\b',
        r'\balice\s*camera\b',
        r'\bbolna\b',
        r'\bringg?\s*ai\b',
        r'\bfireai\b', r'\bfire\s*ai\b',
        r'\bloop\s*ai\b',
        r'\bemergent\b',
        # General startup indicators in company names
        r'\b\w+\.ai\b',  # Companies ending in .ai
    ]

    # =========================================================================
    # NON-STARTUP COMPANIES - Exclude from startup category
    # =========================================================================
    NON_STARTUP_COMPANIES = [
        'tata', 'reliance', 'infosys', 'tcs', 'wipro', 'hcl', 'tech mahindra',
        'cognizant', 'accenture', 'ibm', 'microsoft', 'google', 'amazon', 'meta',
        'facebook', 'apple', 'nvidia', 'intel', 'qualcomm', 'samsung',
        'larsen', 'adani', 'mahindra', 'birla', 'bajaj', 'hdfc', 'icici',
        'airtel', 'jio', 'vodafone', 'ola', 'uber', 'flipkart',
        'paytm', 'zomato', 'swiggy',  # These are now large companies
        'byju', 'unacademy',  # EdTech giants
        # Data/Analytics companies (established, not startups)
        'tredence', 'fractal', 'mu sigma', 'latentview', 'manthan',
        'quantiphi', 'tiger analytics', 'bridgei2i',
        # Major AI companies (not startups)
        'elevenlabs', 'openai', 'anthropic', 'mistral', 'cohere',
        'stability ai', 'midjourney', 'runway', 'hugging face',
        # IT Services
        'mphasis', 'persistent', 'coforge', 'ltimindtree', 'ltim',
        'western union', 'l\'oreal', 'loreal', 'unilever',
        'dell', 'hp', 'hpe', 'cisco', 'oracle', 'sap', 'salesforce',
        'zoho',  # Established company
    ]

    # =========================================================================
    # STARTUP INDICATORS - Signals for startup classification
    # =========================================================================
    STARTUP_INDICATORS = [
        r'\bstartup\b', r'\bstart-up\b', r'\bstart up\b',
        r'\bseed round\b', r'\bseries [a-e]\b', r'\bfunding round\b',
        r'\bpre-seed\b', r'\bseed funding\b', r'\bangel invest',
        r'\bventure capital\b', r'\bvc fund', r'\bvc-backed\b',
        r'\baccelerator\b(?!\s*for\s*retail)',
        r'\bincubator\b',
        r'\bearly-stage\b', r'\bgrowth-stage\b',
        r'\bunicorn\b', r'\bsoonicorn\b',
        r'\bfounded by\b', r'\bco-founder\b', r'\bfounder\b',
        r'\braises?\s+\$?\d+', r'\braised\s+\$?\d+',
        r'\bfreshly funded\b', r'\bnewly launched\b',
        r'\bai\s*startup\b', r'\bai\s*start-up\b',
        r'\bstartups?\s+(?:selected|chosen|picked)\b',
        r'\bsecures?\s+(?:\$|₹|rs\.?|inr)?\s*\d+',
        r'\bbags?\s+(?:\$|₹|rs\.?|inr)?\s*\d+',
        r'\bcloses?\s+(?:\$|₹|rs\.?|inr)?\s*\d+',
    ]

    # =========================================================================
    # EVENT TYPE INDICATORS - Core event types
    # =========================================================================
    EVENT_TYPE_INDICATORS = [
        r'\bconference\b', r'\bconf\b',
        r'\bsummit\b', r'\bconclave\b',
        r'\bsymposium\b', r'\bworkshop\b',
        r'\bseminar\b', r'\bwebinar\b',
        r'\bhackathon\b', r'\bmeetup\b', r'\bmeet-up\b',
        r'\bexpo\b', r'\bexhibition\b', r'\btech\s*fair\b',
        r'\btech\s*fest\b', r'\bai\s*fest\b',
        r'\bkeynote\b',
        r'\bbootcamp\b', r'\bmaster\s*class\b',
        r'\bforum\b',
    ]

    # =========================================================================
    # UPCOMING EVENT INDICATORS - Signals for future events
    # =========================================================================
    UPCOMING_EVENT_INDICATORS = [
        r'\bregistration\s+open\b', r'\bregister\s+now\b', r'\bregister\s+here\b',
        r'\bearly\s+bird\b', r'\bearly\s+registration\b',
        r'\bbook\s+(?:your\s+)?(?:tickets?|seats?|spot)\b',
        r'\bjoin\s+us\b', r'\battend\b', r'\bparticipate\b',
        r'\bupcoming\b', r'\bscheduled\s+(?:for|on)\b',
        r'\bwill\s+be\s+held\b', r'\bto\s+be\s+held\b',
        r'\bhosted\s+by\b', r'\borganized\s+by\b', r'\borganised\s+by\b',
        r'\bwill\s+(?:take\s+place|host|organize|feature)\b',
        r'\b(?:is|are)\s+(?:hosting|organizing|organising)\b',
        r'\bcall\s+for\s+(?:papers|proposals|speakers|participants)\b',
        r'\bdeadline\b.*\bregistration\b',
        r'\bvenue\b',
        r'\bsave\s+the\s+date\b',
        r'\binvites?\s+(?:you|applications|participants)\b',
    ]

    # =========================================================================
    # PAST EVENT INDICATORS - Disqualifying for Events category
    # =========================================================================
    PAST_EVENT_INDICATORS = [
        r'\b(?:was|were)\s+held\b', r'\btook\s+place\b',
        r'\bconcludes?\b', r'\bconcluded\b', r'\bwrapped\s+up\b', r'\bended\b',
        r'\b(?:was|were)\s+(?:hosted|organized|organised)\b',
        r'\bkicked\s+off\b.*\byesterday\b',
        r'\battended\s+(?:by|the)\b',
        r'\bparticipants?\s+attended\b',
        r'\b(?:winners?|awardees?)\s+(?:of|at|from)\b',
        r'\bhighlights?\s+(?:from|of)\b',
        r'\bday\s+\d+\s+(?:of|at)\b',
        r'\b(?:last|this)\s+(?:week|month|year)\'?s?\s+(?:conference|summit|event)\b',
        r'\bsuccessfully\s+(?:held|hosted|organized|concluded)\b',
        r'\bsaw\s+participation\b',
        r'\bannouncements?\s+(?:made\s+)?at\b',
        r'\bannounced\s+at\s+the\b',
        r'\bthe\s+(?:conference|summit|event)\s+(?:was|saw|had|featured)\b',
        r'\b(?:conference|summit|event)\s+concluded\b',
        r'\bconcluded\s+with\b',
    ]

    # =========================================================================
    # CRIME EVENT INDICATORS - Strong disqualification for Events
    # =========================================================================
    CRIME_EVENT_INDICATORS = [
        r'\bpolice\b', r'\bcops?\b', r'\bcrime\b', r'\bcriminal\b',
        r'\bmurder\b', r'\bkilling\b', r'\bhomicide\b',
        r'\binvestigat(?:ion|ing|ed|e)\b',
        r'\barrested?\b', r'\bdetained?\b', r'\bcustody\b',
        r'\bprobe\b', r'\bcracked\b',
        r'\bforensic\b', r'\bcctv\b',
        r'\bsuspect\b', r'\baccused\b', r'\bvictim\b',
        r'\bfraud\b(?!\s+detection)', r'\bscam\b', r'\bcyber\s*crime\b',
        r'\btheft\b', r'\brobbery\b', r'\bburglary\b',
        r'\bfir\b',
        r'\bcourt\b', r'\bjudge\b', r'\btrial\b', r'\bverdict\b',
        r'\blaw\s+enforcement\b',
    ]

    # =========================================================================
    # AI EVENT INDICATORS - Required for Events to have AI relevance
    # =========================================================================
    AI_EVENT_INDICATORS = [
        r'\bai\s+(?:summit|conference|conclave|workshop|expo|forum|fest)\b',
        r'\bartificial\s+intelligence\b',
        r'\bmachine\s+learning\b',
        r'\bdeep\s+learning\b',
        r'\bgenai\b', r'\bgenerative\s+ai\b',
        r'\bdata\s+science\b',
        r'\bai\s+impact\b', r'\bai\s+fest\b',
        r'\b(?:ai|ml|data)\s+(?:conference|summit|workshop|hackathon)\b',
        r'\bai\s+governance\b',
        r'\bresponsible\s+ai\b',
    ]

    # =========================================================================
    # GOVERNMENT INDICATORS - Required for Policies category
    # =========================================================================
    GOVERNMENT_INDICATORS = [
        r'\bgovernment\b', r'\bgovt\b', r'\bminister\b', r'\bministry\b',
        r'\bchief minister\b', r'\bcm\s',
        r'\bcabinet\b', r'\blegislat',
        r'\bstate ai\b', r'\bnational ai\b',
        r'\bdigital india\b', r'\bmake in india\b',
        r'\bpib\b', r'\bpress information bureau\b',
        r'\bpublic[\-\s]sector\b',
        r'\b(?:state|central|union)\s+government\b',
        r'\bgovt\s+(?:launches?|announces?|signs?|partners?)\b',
        r'\bniti\s+aayog\b',
        r'\bmeity\b', r'\bit\s+minister\b',
    ]

    # =========================================================================
    # POLICY ACTION INDICATORS - Required for Policies category
    # =========================================================================
    POLICY_ACTION_INDICATORS = [
        r'\bpolicy\b', r'\bpolicies\b',
        r'\bmission\b', r'\bstrategy\b',
        r'\bregulation\b', r'\bregulatory\b',
        r'\bgovernance\b', r'\bguidelines?\b',
        r'\bframework\b', r'\bblueprint\b',
        r'\bmou\b', r'\bmemorandum of understanding\b',
        r'\bskilling program', r'\bskill development\b',
        r'\bannounced\b.*\bscheme\b', r'\blaunched\b.*\bscheme\b',
        r'\binitiative\b',
        r'\bcouncil\b', r'\bcommittee\b',
        r'\bapproves?\b', r'\bclears?\b',
        # Government action verbs — safe because _is_policy() also requires govt context
        r'\blaunch(?:es|ed|ing)?\b',
        r'\binaugurat(?:es?|ed|ing)\b',
        r'\bunveils?\b',
        r'\brolls?\s+out\b',
    ]

    # =========================================================================
    # PARTNERSHIP SIGNALS - For detecting govt+startup partnerships
    # =========================================================================
    PARTNERSHIP_SIGNALS = [
        r'\bpartners?\s+with\b', r'\bties\s+up\b',
        r'\bsigns?\s+(?:mou|deal|agreement)\b',
        r'\bselects?\b', r'\bchooses?\b', r'\bpicks?\b',
        r'\bteams?\s+up\b', r'\bcollaborates?\s+with\b',
        r'\binks?\s+(?:deal|mou|pact)\b',
    ]

    # =========================================================================
    # ONLINE/PHYSICAL EVENT INDICATORS
    # =========================================================================
    ONLINE_EVENT_INDICATORS = [
        r'\bonline\b', r'\bvirtual\b', r'\bremote\b',
        r'\bwebinar\b', r'\bzoom\b', r'\bteams\b', r'\bgoogle meet\b',
    ]

    PHYSICAL_EVENT_INDICATORS = [
        r'\bin-person\b', r'\boffline\b', r'\bphysical\b',
        r'\bvenue\b', r'\bhotel\b', r'\bconvention cent',
        r'\bregistration desk\b', r'\bnetworking\b',
    ]

    def __init__(self):
        """Initialize categoriser and compile regex patterns."""
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns for performance."""
        self.known_startup_patterns = [re.compile(p, re.IGNORECASE) for p in self.KNOWN_AI_STARTUPS]
        self.startup_patterns = [re.compile(p, re.IGNORECASE) for p in self.STARTUP_INDICATORS]
        self.event_type_patterns = [re.compile(p, re.IGNORECASE) for p in self.EVENT_TYPE_INDICATORS]
        self.upcoming_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.UPCOMING_EVENT_INDICATORS]
        self.past_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.PAST_EVENT_INDICATORS]
        self.crime_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.CRIME_EVENT_INDICATORS]
        self.ai_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.AI_EVENT_INDICATORS]
        self.government_patterns = [re.compile(p, re.IGNORECASE) for p in self.GOVERNMENT_INDICATORS]
        self.policy_action_patterns = [re.compile(p, re.IGNORECASE) for p in self.POLICY_ACTION_INDICATORS]
        self.partnership_patterns = [re.compile(p, re.IGNORECASE) for p in self.PARTNERSHIP_SIGNALS]
        self.online_patterns = [re.compile(p, re.IGNORECASE) for p in self.ONLINE_EVENT_INDICATORS]
        self.physical_patterns = [re.compile(p, re.IGNORECASE) for p in self.PHYSICAL_EVENT_INDICATORS]

    # =========================================================================
    # MAIN CATEGORISATION METHOD - Priority-Ordered Decision Tree
    # =========================================================================

    def categorise(self, title, content="", source_category=None):
        """
        Categorise an article using strict priority-ordered decision tree.

        Priority Order:
        1. Events (highest) - Upcoming, attendable, AI-focused events
        2. Policies and Initiatives - Government-led AI initiatives
        3. AI Start-Up News - Startup funding, launches, milestones
        4. Major AI Developments (default) - Everything else

        Args:
            title: Article headline
            content: Article content/summary
            source_category: Category hint from source config (unused in new logic)

        Returns:
            tuple: (category_name, event_type or None)
        """
        text = f"{title} {content}".lower()

        # Priority 1: Events (highest priority)
        if self._is_valid_event(text):
            event_type = self._determine_event_type(text)
            print(f"  [CATEGORY] Events: {title[:60]}...")
            return "Events", event_type

        # Priority 2: Policies and Initiatives
        # But NOT if it's a government-startup partnership (startup wins per user decision)
        if self._is_policy(text) and not self._is_startup_partnership(text):
            print(f"  [CATEGORY] Policies and Initiatives: {title[:60]}...")
            return "Policies and Initiatives", None

        # Priority 3: AI Start-Up News
        if self._is_startup_news(text):
            print(f"  [CATEGORY] AI Start-Up News: {title[:60]}...")
            return "AI Start-Up News", None

        # Default: Major AI Developments
        print(f"  [CATEGORY] Major AI Developments: {title[:60]}...")
        return "Major AI Developments", None

    # =========================================================================
    # PRIORITY 1: EVENT DETECTION
    # =========================================================================

    def _is_valid_event(self, text):
        """
        Check if article is about an upcoming, AI-related, attendable event.

        Requirements (ALL must be true):
        - Has event type (summit, conference, etc.)
        - NOT a crime/police event
        - NOT a past event
        - Has time/upcoming indicator
        - Has AI relevance (per user decision)
        """
        # Must have event type
        if not self._has_event_type(text):
            return False

        # Must NOT be crime/police event
        if self._is_crime_event(text):
            return False

        # Must NOT be past event
        if self._is_past_event(text):
            return False

        # Must have upcoming indicator
        if not self._has_upcoming_indicator(text):
            return False

        # Must have AI relevance (per user decision: no generic tech events)
        if not self._has_ai_event_relevance(text):
            return False

        return True

    def _has_event_type(self, text):
        """Check if text mentions a specific event type."""
        return any(p.search(text) for p in self.event_type_patterns)

    def _is_crime_event(self, text):
        """Check if article is about crime/police (NOT an attendable event)."""
        crime_count = sum(1 for p in self.crime_event_patterns if p.search(text))
        # Need at least 2 crime indicators to disqualify
        # (avoids false positives from "fraud detection AI")
        return crime_count >= 2

    def _is_past_event(self, text):
        """Check if article is about a past event."""
        return any(p.search(text) for p in self.past_event_patterns)

    def _has_upcoming_indicator(self, text):
        """Check if article has upcoming/future event indicators."""
        return any(p.search(text) for p in self.upcoming_event_patterns)

    def _has_ai_event_relevance(self, text):
        """Check if event has explicit AI focus."""
        return any(p.search(text) for p in self.ai_event_patterns)

    def _determine_event_type(self, text):
        """Determine if event is online, physical, or hybrid."""
        online_matches = sum(1 for p in self.online_patterns if p.search(text))
        physical_matches = sum(1 for p in self.physical_patterns if p.search(text))

        if online_matches > 0 and physical_matches > 0:
            return 'hybrid'
        elif online_matches > 0:
            return 'online'
        elif physical_matches > 0:
            return 'physical'
        else:
            return 'physical'  # Default to physical if unclear

    # =========================================================================
    # PRIORITY 2: POLICY DETECTION
    # =========================================================================

    def _is_policy(self, text):
        """
        Check if article is about government AI policy/initiative.

        Requirements (ALL must be true):
        - Has government actor (ministry, CM, cabinet, etc.)
        - Has policy action (announces, approves, launches scheme, etc.)
        """
        # Must have government context
        if not self._has_government_context(text):
            return False

        # Must have policy/initiative action
        if not self._has_policy_action(text):
            return False

        return True

    def _has_government_context(self, text):
        """Check if article has genuine government context."""
        return any(p.search(text) for p in self.government_patterns)

    def _has_policy_action(self, text):
        """Check if article has policy/initiative action."""
        return any(p.search(text) for p in self.policy_action_patterns)

    def _is_startup_partnership(self, text):
        """
        Check if govt article is actually about a startup partnership.

        Per user decision: govt + known startup = Startup News, not Policies
        """
        # Must have both known startup AND government context
        if not self._is_known_startup(text):
            return False

        if not self._has_government_context(text):
            return False

        # Check for partnership language
        return any(p.search(text) for p in self.partnership_patterns)

    # =========================================================================
    # PRIORITY 3: STARTUP DETECTION
    # =========================================================================

    def _is_startup_news(self, text):
        """
        Check if article is about an AI startup.

        Fast-track: If known startup mentioned, return True immediately.
        Otherwise, check for startup indicators and exclude large companies.
        """
        # Fast-track: Known startup mentioned
        if self._is_known_startup(text):
            return True

        # Check for startup indicators
        has_startup_signal = any(p.search(text) for p in self.startup_patterns)
        if not has_startup_signal:
            return False

        # Must NOT be large incumbent (unless known startup)
        if self._is_large_company(text):
            return False

        return True

    def _is_known_startup(self, text):
        """Check if text mentions a known AI startup."""
        return any(p.search(text) for p in self.known_startup_patterns)

    def _is_large_company(self, text):
        """Check if article is about a large company (not a startup)."""
        text_lower = text.lower()
        for company in self.NON_STARTUP_COMPANIES:
            if company in text_lower:
                return True
        return False
