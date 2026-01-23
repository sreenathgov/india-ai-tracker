"""
Article Categoriser Module

Each accepted item must be assigned to exactly one of the following categories:
1. AI Start-Up News
2. Policies and Initiatives
3. Major AI Developments
4. Events

Rules are strict - if category is unclear, do not force classification.
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from groq import Groq


class Categoriser:
    """Categorises AI articles into one of 4 categories."""

    # Category definitions with keywords and rules

    # 1. AI START-UP NEWS
    # Must concern a startup in the relevant State
    # Company must reasonably qualify as a startup (early-stage or growth-stage)
    # Not large incumbents, PSUs, or major listed firms
    STARTUP_INDICATORS = [
        r'\bstartup\b', r'\bstart-up\b', r'\bstart up\b',
        r'\bseed round\b', r'\bseries [a-e]\b', r'\bfunding round\b',
        r'\bpre-seed\b', r'\bseed funding\b', r'\bangel invest',
        r'\bventure capital\b', r'\bvc fund', r'\bvc-backed\b',
        r'\baccelerator\b(?!\s*for\s*retail)',  # Accelerator but not "Accelerator for Retailers"
        r'\bincubator\b',
        r'\bearly-stage\b', r'\bgrowth-stage\b',
        r'\bunicorn\b', r'\bsoonicorn\b',
        r'\bfounded by\b', r'\bco-founder\b', r'\bfounder\b',
        r'\braises?\s+\$?\d+', r'\braised\s+\$?\d+',  # "raises $10M"
        r'\bfreshly funded\b', r'\bnewly launched\b',
        r'\bai\s*startup\b', r'\bai\s*start-up\b',
        r'\bstartups?\s+(?:selected|chosen|picked)\b',
    ]

    # KNOWN AI STARTUPS - these are ALWAYS startup news
    # This list helps disambiguate when a startup does something newsworthy
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
        # General startup indicators in company names
        r'\b\w+\.ai\b',  # Companies ending in .ai
        r'\b\w+ai\b(?=\s+(?:raises|secures|bags|gets|closes))',  # xAI raises...
    ]

    # Major companies that are NOT startups
    NON_STARTUP_COMPANIES = [
        'tata', 'reliance', 'infosys', 'tcs', 'wipro', 'hcl', 'tech mahindra',
        'cognizant', 'accenture', 'ibm', 'microsoft', 'google', 'amazon', 'meta',
        'facebook', 'apple', 'nvidia', 'intel', 'qualcomm', 'samsung',
        'larsen', 'adani', 'mahindra', 'birla', 'bajaj', 'hdfc', 'icici',
        'airtel', 'jio', 'vodafone', 'ola', 'uber', 'flipkart', 'amazon',
        'paytm', 'zomato', 'swiggy',  # These are now large companies
        'byju', 'unacademy',  # EdTech giants
        # Data/Analytics companies (established, not startups)
        'tredence', 'fractal', 'mu sigma', 'latentview', 'manthan',
        'quantiphi', 'tiger analytics', 'bridgei2i',
        # Major AI companies (not startups)
        'elevenlabs', 'openai', 'anthropic', 'mistral', 'cohere',
        'stability ai', 'midjourney', 'runway', 'hugging face',
    ]

    # 2. POLICIES AND INITIATIVES
    # State-level government policies, AI missions, strategies, official initiatives
    # MoUs and government-led skilling programs related to AI
    # GOVERNMENT PARTNERSHIPS with private companies (e.g., "TN teams up with Sarvam AI")
    # Both announced and implemented policies
    # Private-sector initiatives NOT included here
    # NOTE: "initiative" alone is too broad - many product launches use this word
    POLICY_INDICATORS = [
        r'\bpolicy\b', r'\bpolicies\b',
        r'\bgovernment\s+initiative\b', r'\bgovt\s+initiative\b', r'\bstate\s+initiative\b',
        r'\bpublic\s+sector\s+initiative\b',
        r'\bmission\b', r'\bstrategy\b',
        r'\bregulation\b', r'\bregulatory\b',
        r'\bgovernance\b', r'\bguidelines?\b',
        r'\bframework\b', r'\bblueprint\b',
        r'\bmou\b', r'\bmemorandum of understanding\b',
        r'\bgovernment\b', r'\bgovt\b', r'\bminister\b', r'\bministry\b',
        r'\bchief minister\b', r'\bcm\s',  # "cm" with space to avoid false matches
        r'\bcabinet\b', r'\blegislat',
        r'\bstate ai\b', r'\bnational ai\b',
        r'\bskilling program', r'\bskill development\b',
        r'\bdigital india\b', r'\bmake in india\b',
        r'\bpib\b', r'\bpress information bureau\b',
        r'\bannounced\b.*\bscheme\b', r'\blaunched\b.*\bscheme\b',
        r'\bpublic[\-\s]sector\b',
        # Government-specific context required
        r'\b(?:state|central|union)\s+government\b',
        r'\bgovt\s+(?:launches?|announces?|signs?|partners?)\b',
    ]

    # Product/Company launch indicators - these suggest Major AI Development, not Policy
    PRODUCT_LAUNCH_INDICATORS = [
        r'\bintroduce[sd]?\b', r'\bunveils?\b', r'\blaunches?\b.*\bplatform\b',
        r'\blaunches?\b.*\bproduct\b', r'\blaunches?\b.*\btool\b',
        r'\blaunches?\b.*\bsolution\b', r'\blaunches?\b.*\bservice\b',
        r'\baccelerator\b', r'\bframework\b.*\bretail',  # "Agentic Commerce Accelerators for Retailers"
        r'\bfor\s+(?:retail|enterprise|business|customer)\b',
        r'\brolls?\s+out\b', r'\breleases?\b',
    ]

    # 3. MAJOR AI DEVELOPMENTS
    # Large-scale AI investments, infrastructure projects, AI hubs, fabs, data centres
    # Major corporate expansions tied to AI
    # Product/platform launches by established companies
    # Executive appointments for AI companies
    # Must be concrete; vague exploratory statements don't qualify
    MAJOR_DEV_INDICATORS = [
        r'\b(?:invest|investment)\b.*\b(?:million|billion|crore|lakh)\b',
        r'\b(?:million|billion|crore)\b.*\binvest',
        r'\bdata cent(?:er|re)\b',
        r'\bai hub\b', r'\btech hub\b', r'\binnovation hub\b',
        r'\bfab\b', r'\bfabrication\b', r'\bsemiconductor plant\b',
        r'\bmanufacturing plant\b', r'\bmanufacturing unit\b',
        r'\bexpansion\b', r'\bexpand(?:s|ing)\b',
        r'\bheadquarters?\b', r'\bhq\b',
        r'\bcampus\b', r'\bfacility\b', r'\bplant\b',
        r'\bjobs?\b.*\b(?:thousand|hundred|lakh|\d{3,})\b',
        r'\b(?:thousand|hundred|lakh|\d{3,})\b.*\bjobs?\b',
        r'\bpartnership\b', r'\bcollaboration\b',
        r'\bacquisition\b', r'\bacquires?\b', r'\bmerger\b',
        r'\bipo\b', r'\bpublic offering\b',
        r'\bmarket entry\b', r'\benter(?:s|ing)?\s+(?:the\s+)?(?:indian\s+)?market\b',
        # Product/platform launches (by established companies)
        r'\blaunches?\b',
        r'\bunveils?\b',
        r'\bintroduces?\b',
        r'\brolls?\s+out\b',
        r'\breleases?\b',
        r'\baccelerators?\b',  # Like "Agentic Commerce Accelerators"
        # Executive appointments
        r'\bappoints?\b',
        r'\bhires?\b',
        r'\bcountry\s+head\b',
        r'\bcountry\s+manager\b',
        r'\bmanaging\s+director\b',
        r'\bceo\b', r'\bcto\b', r'\bcoo\b', r'\bcfo\b',
        r'\bhead\s+of\b',
    ]

    # 4. EVENTS
    # ONLY for UPCOMING, ATTENDABLE events (conferences, workshops, summits)
    # NOT for: crime/police events, past events, news about events that happened
    # The key question: "Can someone register/attend this event?"

    # Core event types (these are strong signals)
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
    ]

    # UPCOMING event indicators (strong positive signals)
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
        r'\bvenue\b',  # Venue mentioned suggests upcoming physical event
        r'\bsave\s+the\s+date\b',
        r'\binvites?\s+(?:you|applications|participants)\b',
    ]

    # PAST event indicators (disqualifying - article is about something that already happened)
    PAST_EVENT_INDICATORS = [
        r'\b(?:was|were)\s+held\b', r'\btook\s+place\b',
        r'\bconcludes?\b', r'\bconcluded\b', r'\bwrapped\s+up\b', r'\bended\b',
        r'\b(?:was|were)\s+(?:hosted|organized|organised)\b',
        r'\bkicked\s+off\b.*\byesterday\b',
        r'\battended\s+(?:by|the)\b',  # "attended by 500 people"
        r'\bparticipants?\s+attended\b',  # "5000 participants attended"
        r'\b(?:winners?|awardees?)\s+(?:of|at|from)\b',
        r'\bhighlights?\s+(?:from|of)\b',
        r'\bday\s+\d+\s+(?:of|at)\b',  # "Day 2 of the summit"
        r'\b(?:last|this)\s+(?:week|month|year)\'?s?\s+(?:conference|summit|event)\b',
        r'\bsuccessfully\s+(?:held|hosted|organized|concluded)\b',
        r'\bsaw\s+participation\b',
        # Announcements made AT past events
        r'\bannouncements?\s+(?:made\s+)?at\b',
        r'\bannounced\s+at\s+the\b',
        # Past tense indicators for events
        r'\bthe\s+(?:conference|summit|event)\s+(?:was|saw|had|featured)\b',
        r'\b(?:conference|summit|event)\s+concluded\b',
        r'\bconcluded\s+with\b',  # "concluded with announcements"
    ]

    # CRIME/POLICE event indicators (strong disqualifying - NOT attendable events)
    CRIME_EVENT_INDICATORS = [
        r'\bpolice\b', r'\bcops?\b', r'\bcrime\b', r'\bcriminal\b',
        r'\bmurder\b', r'\bkilling\b', r'\bhomicide\b',
        r'\binvestigat(?:ion|ing|ed|e)\b',
        r'\barrested?\b', r'\bdetained?\b', r'\bcustody\b',
        r'\bprobe\b', r'\bcracked\b',  # "cracked the case"
        r'\bforensic\b', r'\bcctv\b',  # CCTV surveillance
        r'\bsuspect\b', r'\baccused\b', r'\bvictim\b',
        r'\bfraud\b', r'\bscam\b', r'\bcyber\s*crime\b',
        r'\btheft\b', r'\brobbery\b', r'\bburglary\b',
        r'\bfir\b',  # First Information Report (police)
        r'\bcourt\b', r'\bjudge\b', r'\btrial\b', r'\bverdict\b',
        r'\blaw\s+enforcement\b',
    ]

    # Legacy indicator list (kept for backward compatibility but weighted lower)
    EVENT_INDICATORS = [
        r'\bconference\b', r'\bsummit\b', r'\bconclave\b',
        r'\bsymposium\b', r'\bworkshop\b',
        r'\bseminar\b', r'\bwebinar\b',
        r'\bhackathon\b', r'\bmeetup\b',
        r'\bexpo\b', r'\bexhibition\b',
        r'\bkeynote\b',
        r'\bregistration open\b', r'\bregister now\b',
        r'\bearly bird\b',
    ]

    # Event format indicators
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
        self.api_key = os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns."""
        self.startup_patterns = [re.compile(p, re.IGNORECASE) for p in self.STARTUP_INDICATORS]
        self.known_startup_patterns = [re.compile(p, re.IGNORECASE) for p in self.KNOWN_AI_STARTUPS]
        self.policy_patterns = [re.compile(p, re.IGNORECASE) for p in self.POLICY_INDICATORS]
        self.major_dev_patterns = [re.compile(p, re.IGNORECASE) for p in self.MAJOR_DEV_INDICATORS]
        self.event_patterns = [re.compile(p, re.IGNORECASE) for p in self.EVENT_INDICATORS]
        self.online_patterns = [re.compile(p, re.IGNORECASE) for p in self.ONLINE_EVENT_INDICATORS]
        self.physical_patterns = [re.compile(p, re.IGNORECASE) for p in self.PHYSICAL_EVENT_INDICATORS]
        self.product_launch_patterns = [re.compile(p, re.IGNORECASE) for p in self.PRODUCT_LAUNCH_INDICATORS]
        # New event-specific patterns
        self.event_type_patterns = [re.compile(p, re.IGNORECASE) for p in self.EVENT_TYPE_INDICATORS]
        self.upcoming_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.UPCOMING_EVENT_INDICATORS]
        self.past_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.PAST_EVENT_INDICATORS]
        self.crime_event_patterns = [re.compile(p, re.IGNORECASE) for p in self.CRIME_EVENT_INDICATORS]

    def _is_known_startup(self, text):
        """Check if text mentions a known AI startup."""
        for pattern in self.known_startup_patterns:
            if pattern.search(text):
                return True
        return False

    def _is_product_launch(self, text):
        """Check if article is about a product/service launch (not policy)."""
        for pattern in self.product_launch_patterns:
            if pattern.search(text):
                return True
        return False

    def _is_crime_event(self, text):
        """Check if article is about crime/police (NOT an attendable event)."""
        crime_count = 0
        for pattern in self.crime_event_patterns:
            if pattern.search(text):
                crime_count += 1
        # Need at least 2 crime indicators to disqualify
        # (avoids false positives from single mentions like "fraud detection AI")
        return crime_count >= 2

    def _is_past_event(self, text):
        """Check if article is about a past event (NOT an upcoming event)."""
        for pattern in self.past_event_patterns:
            if pattern.search(text):
                return True
        return False

    def _is_upcoming_event(self, text):
        """Check if article is about an upcoming, attendable event."""
        upcoming_count = 0
        for pattern in self.upcoming_event_patterns:
            if pattern.search(text):
                upcoming_count += 1
        return upcoming_count >= 1

    def _has_event_type(self, text):
        """Check if article mentions a specific event type (conference, summit, etc.)."""
        for pattern in self.event_type_patterns:
            if pattern.search(text):
                return True
        return False

    def _calculate_event_score(self, text):
        """
        Calculate event score with proper logic for upcoming vs past/crime events.

        Returns:
            int: Score for Events category (can be negative to disqualify)
        """
        # First, check for disqualifying patterns
        if self._is_crime_event(text):
            return -10  # Strong negative - definitely NOT an attendable event

        # Check for event type indicators (conference, summit, etc.)
        has_event_type = self._has_event_type(text)
        if not has_event_type:
            return 0  # No clear event type mentioned

        # Check if it's about a past event
        is_past = self._is_past_event(text)

        # Check if it's about an upcoming event
        is_upcoming = self._is_upcoming_event(text)

        # Calculate score
        score = 0

        if has_event_type:
            score += 2  # Base score for mentioning an event type

        if is_upcoming:
            score += 4  # Strong boost for upcoming events

        if is_past:
            score -= 5  # Significant penalty for past events

        # Additional boost for registration/attendance language
        if re.search(r'\b(?:register|registration|tickets?|book\s+your|join\s+us|attend)\b', text, re.IGNORECASE):
            score += 3

        return score

    def _has_government_context(self, text):
        """Check if article has genuine government context."""
        govt_patterns = [
            r'\bgovernment\b', r'\bgovt\b', r'\bminister\b', r'\bministry\b',
            r'\bchief minister\b', r'\bcabinet\b', r'\bpublic sector\b',
            r'\bstate\s+(?:launches?|announces?|signs?)\b',
            r'\bcentral\s+(?:launches?|announces?|signs?)\b',
        ]
        text_lower = text.lower()
        for pattern in govt_patterns:
            if re.search(pattern, text_lower):
                return True
        return False

    def _count_matches(self, patterns, text):
        """Count how many patterns match in text."""
        count = 0
        for pattern in patterns:
            if pattern.search(text):
                count += 1
        return count

    def _is_large_company(self, text):
        """Check if article is about a large company (not a startup)."""
        text_lower = text.lower()
        for company in self.NON_STARTUP_COMPANIES:
            if company in text_lower:
                return True
        return False

    def categorise(self, title, content="", source_category=None):
        """
        Determine the category for an article.

        Args:
            title: Article headline
            content: Article content/summary
            source_category: Category from source configuration (hint)

        Returns:
            tuple: (category_name, event_type or None)
                   event_type is 'online', 'physical', or 'hybrid' for events
        """
        combined_text = f"{title} {content}"

        # PRIORITY CHECK: Known AI startups should ALWAYS be startup news
        # Unless there's strong government context (then it's policy - e.g., govt partners with startup)
        is_known_startup = self._is_known_startup(combined_text)

        # Calculate match scores for each category
        # NOTE: Events uses special scoring to filter out crime/past events
        scores = {
            'Events': self._calculate_event_score(combined_text),  # Special scoring for events
            'Policies and Initiatives': self._count_matches(self.policy_patterns, combined_text),
            'AI Start-Up News': self._count_matches(self.startup_patterns, combined_text),
            'Major AI Developments': self._count_matches(self.major_dev_patterns, combined_text),
        }

        # STARTUP BOOST: If it mentions a known AI startup, boost startup score significantly
        if is_known_startup:
            scores['AI Start-Up News'] += 5  # Strong boost for known startups
            # If also mentions funding/raises, even stronger
            if re.search(r'\b(?:raises?|raised|secures?|bags?|gets?|closes?)\s+(?:\$|₹|rs\.?|inr)?\s*\d+', combined_text, re.IGNORECASE):
                scores['AI Start-Up News'] += 3

        # STARTUP DETECTION: Check for explicit startup mentions in title/text
        # "start-ups unveil" or "startups launch" should be startup news, not major development
        if re.search(r'\b(?:start-?ups?|startup)\s+(?:unveil|launch|introduce|roll|release|develop|create|build)', combined_text, re.IGNORECASE):
            scores['AI Start-Up News'] += 4
        if re.search(r'\bindian\s+start-?ups?\b', combined_text, re.IGNORECASE):
            scores['AI Start-Up News'] += 3

        # Apply rules and adjustments

        # Rule: If it's about a large company (and NOT a known startup), it's NOT startup news
        if scores['AI Start-Up News'] > 0 and self._is_large_company(combined_text) and not is_known_startup:
            scores['AI Start-Up News'] = 0
            scores['Major AI Developments'] += 2  # Likely major development instead

        # Rule: Product/service launches by NON-STARTUPS are NOT policies
        # But startups launching products IS startup news
        if self._is_product_launch(combined_text):
            if is_known_startup:
                scores['AI Start-Up News'] += 2  # Startup product launch = startup news
                scores['Major AI Developments'] = max(0, scores['Major AI Developments'] - 2)
            elif not self._has_government_context(combined_text):
                scores['Policies and Initiatives'] = 0
                scores['Major AI Developments'] += 2

        # Rule: Government involvement pushes toward Policy
        # BUT: "Startup selected by government program" is still startup news
        has_govt = self._has_government_context(combined_text)
        if has_govt:
            # Check if it's a startup being selected/partnering with govt
            is_startup_selection = re.search(r'\b(?:startups?|start-ups?)\s+(?:selected|chosen|picked|shortlisted)\b', combined_text, re.IGNORECASE)
            is_govt_startup_program = re.search(r'\b(?:accelerator|incubator|cohort|programme|program)\b.*\bstartups?\b', combined_text, re.IGNORECASE)

            if is_startup_selection or (is_known_startup and is_govt_startup_program):
                scores['AI Start-Up News'] += 3  # This is startup news, not policy
            else:
                scores['Policies and Initiatives'] += 2

        # Rule: Event dates only boost if there's already an event type AND it's upcoming
        # Don't boost just because a date is mentioned (crime reports have dates too!)
        if self._has_event_type(combined_text) and self._is_upcoming_event(combined_text):
            if re.search(r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}', combined_text, re.IGNORECASE):
                scores['Events'] += 1

        # Get highest scoring category
        max_score = max(scores.values())

        # IMPORTANT: If Events was actively disqualified (negative score),
        # don't let LLM or source hint override to Events
        events_disqualified = scores['Events'] < 0

        # If no clear signal, use source category hint or fallback to LLM
        if max_score == 0:
            if source_category and source_category in scores:
                # Don't use Events hint if it was disqualified
                if source_category == 'Events' and events_disqualified:
                    return self._llm_categorise(title, content, exclude_events=True)
                return source_category, None
            return self._llm_categorise(title, content, exclude_events=events_disqualified)

        # Get the winning category
        winning_category = max(scores, key=scores.get)

        # Handle ties by priority: Events > Policy > Startup > Major Dev
        # CHANGED: Startups now have higher priority than Major AI Developments
        # Because our startup detection is now more robust with known startup list
        if list(scores.values()).count(max_score) > 1:
            priority_order = ['Events', 'Policies and Initiatives', 'AI Start-Up News', 'Major AI Developments']
            for cat in priority_order:
                if scores[cat] == max_score:
                    winning_category = cat
                    break

        # Determine event type if category is Events
        event_type = None
        if winning_category == 'Events':
            event_type = self._determine_event_type(combined_text)

        print(f"  [CATEGORY] {winning_category}: {title[:60]}...")
        return winning_category, event_type

    def _determine_event_type(self, text):
        """Determine if event is online, physical, or hybrid."""
        online_matches = self._count_matches(self.online_patterns, text)
        physical_matches = self._count_matches(self.physical_patterns, text)

        if online_matches > 0 and physical_matches > 0:
            return 'hybrid'
        elif online_matches > 0:
            return 'online'
        elif physical_matches > 0:
            return 'physical'
        else:
            return 'physical'  # Default to physical if unclear

    def _llm_categorise(self, title, content, exclude_events=False):
        """Use LLM for ambiguous cases.

        Args:
            title: Article title
            content: Article content
            exclude_events: If True, don't allow Events as a category (for past/crime events)
        """
        if not self.client:
            return 'Major AI Developments', None  # Safe default

        try:
            # Build categories list - exclude Events if it was disqualified
            if exclude_events:
                categories_text = """CATEGORIES:
1. AI Start-Up News - News about early-stage/growth-stage AI startups (funding, launches, milestones)
2. Policies and Initiatives - Government policies, official initiatives, AI missions, regulations
3. Major AI Developments - Large investments, infrastructure projects, big company expansions

NOTE: Do NOT categorise as Events - this article is about a past event or crime news, not an upcoming attendable event."""
            else:
                categories_text = """CATEGORIES:
1. AI Start-Up News - News about early-stage/growth-stage AI startups (funding, launches, milestones)
2. Policies and Initiatives - Government policies, official initiatives, AI missions, regulations
3. Major AI Developments - Large investments, infrastructure projects, big company expansions
4. Events - ONLY upcoming conferences, summits, workshops that people can attend/register for"""

            prompt = f"""Categorise this AI news article into exactly ONE category.

ARTICLE: {title}
EXCERPT: {content[:400] if content else 'No content'}

{categories_text}

Answer with ONLY the category name (e.g., "AI Start-Up News")"""

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=20
            )

            result = response.choices[0].message.content.strip()

            # Normalize the response
            # Exclude Events from valid categories if it was disqualified
            if exclude_events:
                valid_categories = ['AI Start-Up News', 'Policies and Initiatives', 'Major AI Developments']
            else:
                valid_categories = ['AI Start-Up News', 'Policies and Initiatives', 'Major AI Developments', 'Events']

            for cat in valid_categories:
                if cat.lower() in result.lower():
                    return cat, None

            return 'Major AI Developments', None  # Fallback

        except Exception as e:
            print(f"  [CATEGORISE] LLM error: {e}")
            return 'Major AI Developments', None
