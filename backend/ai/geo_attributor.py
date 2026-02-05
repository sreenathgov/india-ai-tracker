"""
Geographic Attribution Module - CONSERVATIVE IMPLEMENTATION

Core Principle: Location must be the SUBJECT of the news, not an incidental attribute.

ACCEPTABLE GROUNDS FOR STATE ATTRIBUTION (all require explicit evidence):
1. STATE GOVERNMENT ACTION - State govt announces/implements AI policy/initiative
2. PHYSICAL ACTIVITY - AI facility/hub/office being SET UP in that state
3. LOCATION-BOUND EVENT - AI event PHYSICALLY taking place in that state
4. EXPLICIT INVESTMENT - Capital investment explicitly tied to that state

DISALLOWED SIGNALS (must NEVER independently cause state attribution):
- Company headquarters location
- Startup's known base
- News source/publisher location
- Datelines (e.g., "Chennai: ...")
- Passing city mentions in quotes or examples

DEFAULT BEHAVIOR: If no explicit state signal found, return 'IN' (All India).
Conservative attribution is a correct and expected outcome.
"""

import re
from typing import Tuple, List, Set, Optional


class GeoAttributor:
    """Conservative geographic attribution - location must be the SUBJECT."""

    # ==================== STATE NAME MAPPINGS ====================
    STATE_NAME_MAP = {
        'tamil nadu': 'TN', 'tamilnadu': 'TN',
        'karnataka': 'KA',
        'maharashtra': 'MH',
        'delhi': 'DL', 'new delhi': 'DL',
        'telangana': 'TG',
        'andhra pradesh': 'AP', 'andhra': 'AP',
        'west bengal': 'WB', 'bengal': 'WB',
        'gujarat': 'GJ',
        'rajasthan': 'RJ',
        'uttar pradesh': 'UP',
        'kerala': 'KL',
        'punjab': 'PB',
        'haryana': 'HR',
        'madhya pradesh': 'MP',
        'bihar': 'BR',
        'odisha': 'OD', 'orissa': 'OD',
        'assam': 'AS',
        'jharkhand': 'JH',
        'chhattisgarh': 'CG', 'chattisgarh': 'CG',
        'uttarakhand': 'UK', 'uttaranchal': 'UK',
        'goa': 'GA',
        'himachal pradesh': 'HP', 'himachal': 'HP',
        'jammu and kashmir': 'JK', 'jammu & kashmir': 'JK', 'kashmir': 'JK',
        'manipur': 'MN',
        'meghalaya': 'ML',
        'mizoram': 'MZ',
        'nagaland': 'NL',
        'tripura': 'TR',
        'arunachal pradesh': 'AR', 'arunachal': 'AR',
        'sikkim': 'SK',
        'puducherry': 'PY', 'pondicherry': 'PY',
        'ladakh': 'LA',
        'chandigarh': 'CH',
    }

    # ==================== CITY TO STATE MAPPING ====================
    # Only major cities - used for resolving location mentions, NOT for auto-assignment
    CITY_STATE_MAP = {
        # Tamil Nadu
        'chennai': 'TN', 'madras': 'TN', 'coimbatore': 'TN', 'madurai': 'TN',
        'tiruchirappalli': 'TN', 'trichy': 'TN', 'salem': 'TN', 'tiruppur': 'TN',
        'vellore': 'TN', 'hosur': 'TN',

        # Karnataka
        'bengaluru': 'KA', 'bangalore': 'KA', 'mysuru': 'KA', 'mysore': 'KA',
        'hubli': 'KA', 'mangaluru': 'KA', 'mangalore': 'KA', 'belgaum': 'KA',
        'belagavi': 'KA',

        # Maharashtra
        'mumbai': 'MH', 'bombay': 'MH', 'pune': 'MH', 'nagpur': 'MH',
        'thane': 'MH', 'nashik': 'MH', 'aurangabad': 'MH', 'navi mumbai': 'MH',

        # Delhi NCR
        'delhi': 'DL', 'new delhi': 'DL', 'noida': 'DL', 'gurgaon': 'DL',
        'gurugram': 'DL', 'faridabad': 'DL', 'ghaziabad': 'DL', 'ncr': 'DL',
        'greater noida': 'DL',

        # Telangana
        'hyderabad': 'TG', 'secunderabad': 'TG', 'warangal': 'TG',
        'cyberabad': 'TG', 'hitec city': 'TG', 'gachibowli': 'TG',

        # Andhra Pradesh
        'visakhapatnam': 'AP', 'vizag': 'AP', 'vijayawada': 'AP',
        'guntur': 'AP', 'tirupati': 'AP', 'amaravati': 'AP',

        # West Bengal
        'kolkata': 'WB', 'calcutta': 'WB', 'howrah': 'WB', 'durgapur': 'WB',
        'salt lake': 'WB', 'saltlake': 'WB', 'newtown': 'WB',

        # Gujarat
        'ahmedabad': 'GJ', 'surat': 'GJ', 'vadodara': 'GJ', 'baroda': 'GJ',
        'rajkot': 'GJ', 'gandhinagar': 'GJ', 'gift city': 'GJ',

        # Rajasthan
        'jaipur': 'RJ', 'jodhpur': 'RJ', 'udaipur': 'RJ', 'kota': 'RJ',

        # Uttar Pradesh
        'lucknow': 'UP', 'kanpur': 'UP', 'varanasi': 'UP', 'agra': 'UP',
        'prayagraj': 'UP', 'allahabad': 'UP', 'meerut': 'UP',

        # Kerala
        'thiruvananthapuram': 'KL', 'trivandrum': 'KL', 'kochi': 'KL',
        'cochin': 'KL', 'kozhikode': 'KL', 'calicut': 'KL',
        'technopark': 'KL', 'infopark': 'KL',

        # Punjab
        'chandigarh': 'PB', 'ludhiana': 'PB', 'amritsar': 'PB', 'mohali': 'PB',

        # Madhya Pradesh
        'bhopal': 'MP', 'indore': 'MP', 'gwalior': 'MP', 'jabalpur': 'MP',

        # Bihar
        'patna': 'BR', 'gaya': 'BR', 'muzaffarpur': 'BR',

        # Odisha
        'bhubaneswar': 'OD', 'cuttack': 'OD', 'rourkela': 'OD',

        # Assam
        'guwahati': 'AS', 'dibrugarh': 'AS',

        # Jharkhand
        'ranchi': 'JH', 'jamshedpur': 'JH', 'dhanbad': 'JH', 'bokaro': 'JH',

        # Chhattisgarh
        'raipur': 'CG', 'bhilai': 'CG', 'bilaspur': 'CG',

        # Uttarakhand
        'dehradun': 'UK', 'haridwar': 'UK', 'rishikesh': 'UK',

        # Goa
        'panaji': 'GA', 'panjim': 'GA', 'margao': 'GA', 'vasco': 'GA',

        # Northeast & Others
        'imphal': 'MN', 'shillong': 'ML', 'aizawl': 'MZ', 'kohima': 'NL',
        'agartala': 'TR', 'itanagar': 'AR', 'gangtok': 'SK',
        'shimla': 'HP', 'dharamshala': 'HP',
        'srinagar': 'JK', 'jammu': 'JK', 'leh': 'LA',
    }

    # ==================== STATE GOVERNMENT PATTERNS ====================
    # Patterns that indicate state government action (RULE 1)
    STATE_GOVT_PATTERNS = {
        'TN': [
            r'\btamil\s*nadu\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\btn\s+(?:govt|government|cabinet|cm|chief\s*minister)\b',
            r'\bchennai\s+(?:govt|government|state)\b',
            r'\bm\.?k\.?\s*stalin\b',  # Current CM
        ],
        'KA': [
            r'\bkarnataka\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bsiddaramaiah\b',  # Current CM
            r'\bbengaluru\s+(?:govt|government|state)\b',
        ],
        'MH': [
            r'\bmaharashtra\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bmumbai\s+(?:govt|government|state)\b',
            r'\beknath\s+shinde\b',  # Current CM
        ],
        'DL': [
            r'\bdelhi\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\baap\s+(?:govt|government)\b',
            r'\barvind\s*kejriwal\b',
            r'\batishi\b',  # Current CM
        ],
        'TG': [
            r'\btelangana\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\brevanth\s+reddy\b',  # Current CM
            r'\bhyder(?:abad)?\s+(?:govt|government|state)\b',
        ],
        'AP': [
            r'\bandhra\s*(?:pradesh)?\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bn\.?\s*chandrababu\s*naidu\b',  # Current CM
        ],
        'WB': [
            r'\bwest\s*bengal\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bmamata\s*banerjee\b',  # Current CM
            r'\bkolkata\s+(?:govt|government|state)\b',
        ],
        'GJ': [
            r'\bgujarat\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bbhupendra\s*patel\b',  # Current CM
        ],
        'RJ': [
            r'\brajasthan\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bbhajan\s*lal\s*sharma\b',  # Current CM
        ],
        'UP': [
            r'\buttar\s*pradesh\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\byogi\s*adityanath\b',  # Current CM
            r'\blucknow\s+(?:govt|government|state)\b',
        ],
        'KL': [
            r'\bkerala\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bpinarayi\s*vijayan\b',  # Current CM
        ],
        'PB': [
            r'\bpunjab\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bbhagwant\s*mann\b',  # Current CM
        ],
        'HR': [
            r'\bharyana\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bnayab\s*singh\s*saini\b',  # Current CM
        ],
        'MP': [
            r'\bmadhya\s*pradesh\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bmohan\s*yadav\b',  # Current CM
        ],
        'OD': [
            r'\bodisha\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bmohan\s*charan\s*majhi\b',  # Current CM
        ],
        'AS': [
            r'\bassam\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bhimanta\s*biswa\s*sarma\b',  # Current CM
        ],
        'JH': [
            r'\bjharkhand\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bhemant\s*soren\b',  # Current CM
        ],
        'CG': [
            r'\bchhattisgarh\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bvishnu\s*deo\s*sai\b',  # Current CM
        ],
        'UK': [
            r'\buttarakhand\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bpushkar\s*singh\s*dhami\b',  # Current CM
        ],
        'GA': [
            r'\bgoa\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bpramod\s*sawant\b',  # Current CM
        ],
        'HP': [
            r'\bhimachal\s*(?:pradesh)?\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bsukhvinder\s*singh\s*sukhu\b',  # Current CM
        ],
        'BR': [
            r'\bbihar\s+(?:govt|government|cabinet|cm|chief\s*minister|minister|assembly|state)\b',
            r'\bnitish\s*kumar\b',  # Current CM
        ],
    }

    # ==================== PHYSICAL ACTIVITY PATTERNS ====================
    # Patterns indicating physical/operational activity being set up (RULE 2)
    PHYSICAL_ACTIVITY_VERBS = [
        r'\bopen(?:s|ed|ing)?\b',
        r'\blaunch(?:es|ed|ing)?\b',
        r'\bset(?:s|ting)?\s+up\b',
        r'\bestablish(?:es|ed|ing)?\b',
        r'\bbuild(?:s|ing)?\b',
        r'\bconstruct(?:s|ed|ing)?\b',
        r'\bexpand(?:s|ed|ing)?\b',  # Match expand anywhere, location check happens later
        r'\binaugurat(?:es?|ed|ing)\b',
        r'\bcommission(?:s|ed|ing)?\b',
    ]

    PHYSICAL_ACTIVITY_NOUNS = [
        r'\b(?:ai|data|tech|technology|research|innovation|development)\s+(?:centre|center|hub|park|campus|facility|lab|laboratory|operations?)\b',
        r'\b(?:data\s+)?cent(?:re|er)\b',
        r'\boffice\b',
        r'\bheadquarters?\b',
        r'\bfacility\b',
        r'\bcampus\b',
        r'\boperations?\b',
        r'\bfab(?:rication)?\s+(?:plant|facility|unit)\b',
        r'\bmanufacturing\s+(?:plant|facility|unit)\b',
        r'\bR&D\s+(?:centre|center|hub|facility)\b',
        r'\bGCC\b',  # Global Capability Center
        r'\bglobal\s+capability\s+cent(?:re|er)\b',
    ]

    # ==================== EVENT PATTERNS ====================
    # Patterns indicating physical events (RULE 3)
    EVENT_TYPES = [
        r'\bsummit\b', r'\bconference\b', r'\bconclave\b', r'\bworkshop\b',
        r'\bexpo\b', r'\bexhibition\b', r'\bfest(?:ival)?\b', r'\bsymposium\b',
        r'\bhackathon\b', r'\bmeet(?:up)?\b', r'\bforum\b', r'\bcongress\b',
    ]

    ONLINE_EVENT_INDICATORS = [
        r'\bvirtual\b', r'\bonline\b', r'\bwebinar\b', r'\bdigital\s+event\b',
        r'\bremote\b', r'\bweb-based\b',
    ]

    # ==================== INVESTMENT PATTERNS ====================
    # Patterns indicating explicit investment/deployment (RULE 4)
    INVESTMENT_PATTERNS = [
        r'\binvest(?:s|ed|ing|ment)?\s+(?:₹|rs\.?|inr|usd|\$)?\s*[\d,\.]+\s*(?:cr(?:ore)?|lakh|million|billion|mn|bn)?\s+(?:in|into|for)\b',
        r'\b(?:₹|rs\.?|inr)\s*[\d,\.]+\s*(?:cr(?:ore)?|lakh|million|billion|mn|bn)?\s+(?:investment|infusion|funding)\s+(?:in|for)\b',
        r'\binvestment\s+(?:in|for|into)\b',  # Simple "investment in" pattern
        r'\bdeploy(?:s|ed|ing|ment)?\s+(?:in|across)\b',
        r'\broll(?:s|ed|ing)?\s*out\s+(?:in|across)\b',
        r'\bpilot\b.*\b(?:in|at|across)\b',  # More flexible pilot matching
        r'\bexpansion\s+(?:in|to|into)\b',
        r'\blaunch(?:es|ed|ing)?\s+(?:in|at|across)\b',  # launches in city
    ]

    # ==================== CENTRAL GOVERNMENT / NATIONAL INDICATORS ====================
    # These indicate national scope - should return 'IN', not a specific state
    NATIONAL_INDICATORS = [
        r'\bcentral\s+government\b',
        r'\bunion\s+government\b',
        r'\bgovernment\s+of\s+india\b',
        r'\bmeity\b',
        r'\bministry\s+of\b',
        r'\bniti\s+aayog\b',
        r'\bparliament\b',
        r'\brajya\s+sabha\b',
        r'\blok\s+sabha\b',
        r'\bnational\s+ai\b',
        r'\bindia[\'\"]?s\s+ai\b',
        r'\bacross\s+india\b',
        r'\bpan[- ]?india\b',
        r'\bnationwide\b',
        r'\bacross\s+(?:the\s+)?country\b',
        r'\ball\s+(?:over\s+)?india\b',
        r'\bunion\s+minister\b',
        r'\bcentral\s+minister\b',
        r'\bindia\s+targets\b',
        r'\bindia\s+aims\b',
        r'\bindia\s+launches\b',
    ]

    def __init__(self):
        """Initialize the geographic attributor with compiled patterns."""
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns for performance."""
        # Compile national indicators
        self.national_patterns = [re.compile(p, re.IGNORECASE) for p in self.NATIONAL_INDICATORS]

        # Compile state govt patterns
        self.compiled_state_govt_patterns = {}
        for state, patterns in self.STATE_GOVT_PATTERNS.items():
            self.compiled_state_govt_patterns[state] = [re.compile(p, re.IGNORECASE) for p in patterns]

        # Compile physical activity patterns
        self.compiled_activity_verbs = [re.compile(p, re.IGNORECASE) for p in self.PHYSICAL_ACTIVITY_VERBS]
        self.compiled_activity_nouns = [re.compile(p, re.IGNORECASE) for p in self.PHYSICAL_ACTIVITY_NOUNS]

        # Compile event patterns
        self.compiled_event_types = [re.compile(p, re.IGNORECASE) for p in self.EVENT_TYPES]
        self.compiled_online_indicators = [re.compile(p, re.IGNORECASE) for p in self.ONLINE_EVENT_INDICATORS]

        # Compile investment patterns
        self.compiled_investment_patterns = [re.compile(p, re.IGNORECASE) for p in self.INVESTMENT_PATTERNS]

    def attribute(self, title: str, content: str = "", source_state: str = None,
                  is_state_specific_source: bool = False, geo_mode: str = "default") -> Tuple[List[str], str]:
        """
        Conservative geographic attribution.

        Args:
            title: Article headline
            content: Article content (first 2000 chars used)
            source_state: State code from source configuration
            is_state_specific_source: Whether source is state-specific
            geo_mode: How to use source_state:
                     - 'force': Force include this state (only for official govt sources)
                     - 'default': Use as fallback if no other state found
                     - 'strict': Only use if content explicitly mentions it

        Returns:
            Tuple of (list of state codes, attribution reason string)
            Examples: (['TN'], 'GOVT_ACTION:TN')
                      (['IN'], 'NO_STATE_SIGNAL')
                      (['KA', 'TN'], 'GOVT_ACTION:KA; PHYSICAL_ACTIVITY:TN')
        """
        title_lower = title.lower()
        content_lower = (content[:2000] if content else "").lower()
        text = f"{title_lower} {content_lower}"

        found_states: Set[str] = set()
        attribution_reasons: List[str] = []

        # EARLY CHECK: Is this clearly a national-level article?
        if self._is_national_article(text):
            # Check if there are ALSO specific state signals (multi-state project)
            # If not, return national immediately
            pass  # Continue to check for state-specific signals

        # RULE 1: Check for State Government Action
        govt_states = self._check_govt_action(text)
        for state in govt_states:
            found_states.add(state)
            attribution_reasons.append(f"GOVT_ACTION:{state}")

        # RULE 2: Check for Physical Activity in State
        activity_states = self._check_physical_activity(text)
        for state in activity_states:
            found_states.add(state)
            attribution_reasons.append(f"PHYSICAL_ACTIVITY:{state}")

        # RULE 3: Check for Location-Bound Event
        if self._is_physical_event(text):
            event_states = self._extract_event_locations(text)
            for state in event_states:
                found_states.add(state)
                attribution_reasons.append(f"EVENT_LOCATION:{state}")

        # RULE 4: Check for Explicit Investment/Deployment
        investment_states = self._check_investment(text)
        for state in investment_states:
            found_states.add(state)
            attribution_reasons.append(f"INVESTMENT:{state}")

        # SPECIAL: geo_mode handling (revised - very conservative)
        if source_state and geo_mode == 'force' and is_state_specific_source:
            # Only force-add for official government sources
            # This should be rare - only tn.gov.in, karnataka.gov.in type sources
            if not found_states:  # Only if no other signal found
                found_states.add(source_state)
                attribution_reasons.append(f"OFFICIAL_SOURCE:{source_state}")

        # If national indicators present AND no state-specific signals, return IN
        if self._is_national_article(text) and not found_states:
            return ['IN'], "NATIONAL_SCOPE"

        # DEFAULT: If no states found, return All India
        if not found_states:
            return ['IN'], "NO_STATE_SIGNAL"

        return list(found_states), "; ".join(attribution_reasons)

    def _is_national_article(self, text: str) -> bool:
        """Check if article is clearly national-level."""
        for pattern in self.national_patterns:
            if pattern.search(text):
                return True
        return False

    def _check_govt_action(self, text: str) -> Set[str]:
        """
        RULE 1: Check for state government action.
        Returns set of state codes where government action is detected.
        """
        found = set()
        for state_code, patterns in self.compiled_state_govt_patterns.items():
            for pattern in patterns:
                if pattern.search(text):
                    found.add(state_code)
                    break  # Found for this state, move to next
        return found

    def _check_physical_activity(self, text: str) -> Set[str]:
        """
        RULE 2: Check for physical/operational activity being set up.
        Returns set of state codes where physical activity is being established.
        """
        found = set()

        # Must have both: activity verb AND activity noun
        has_verb = any(p.search(text) for p in self.compiled_activity_verbs)
        has_noun = any(p.search(text) for p in self.compiled_activity_nouns)

        if not (has_verb and has_noun):
            return found

        # Look for location mentions near the activity
        # Pattern: "[verb] [noun] in/at [location]"
        activity_location_patterns = [
            r'(?:open(?:s|ed|ing)?|launch(?:es|ed|ing)?|set(?:s|ting)?\s+up|establish(?:es|ed|ing)?|build(?:s|ing)?|inaugurate[sd]?)\s+(?:\w+\s+){0,5}(?:in|at)\s+([A-Za-z][A-Za-z\s]+?)(?:\.|,|$|\s+(?:to|for|with|and|the|a|an))',
            r'(?:new|first|upcoming)\s+(?:\w+\s+){0,3}(?:centre|center|hub|office|facility|campus|park)\s+(?:in|at)\s+([A-Za-z][A-Za-z\s]+?)(?:\.|,|$|\s+(?:to|for|with|and|the|a|an))',
            r'(?:expands?|expanding)\s+(?:\w+\s+){0,5}(?:to|in|into)\s+([A-Za-z][A-Za-z\s]+?)(?:\.|,|$|\s+(?:for|with|and|the|a|an))',  # expands [words] to city
            r'(?:facility|centre|center|hub|office|campus)\s+(?:in|at|to)\s+([A-Za-z][A-Za-z\s]+?)(?:\.|,|$)',  # facility in/to city
        ]

        for pattern in activity_location_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                state = self._resolve_location_to_state(match.strip())
                if state:
                    found.add(state)

        return found

    def _is_physical_event(self, text: str) -> bool:
        """
        RULE 3 (part 1): Check if this is a physical (not online) event.
        """
        # Must have event type indicator
        has_event = any(p.search(text) for p in self.compiled_event_types)
        if not has_event:
            return False

        # Must NOT be online-only
        is_online = any(p.search(text) for p in self.compiled_online_indicators)
        if is_online:
            return False

        # Must have venue/location indicator
        venue_patterns = [
            r'\b(?:at|in|held\s+(?:at|in)|venue|location)\s+[A-Z]',
            r'\b(?:bangalore|bengaluru|chennai|mumbai|delhi|hyderabad|pune|kolkata)',  # Direct city mention
        ]
        has_venue = any(re.search(p, text, re.IGNORECASE) for p in venue_patterns)

        return has_venue

    def _extract_event_locations(self, text: str) -> Set[str]:
        """
        RULE 3 (part 2): Extract states where physical events are happening.
        """
        found = set()

        # Patterns for event locations
        event_location_patterns = [
            r'(?:summit|conference|conclave|workshop|expo|hackathon|meet|forum)\s+(?:\d{4}\s+)?(?:at|in)\s+([A-Za-z][A-Za-z\s]+?)(?:\.|,|$|\s+(?:to|on|from))',
            r'(?:held|happening|taking\s+place)\s+(?:at|in)\s+([A-Za-z][A-Za-z\s]+?)(?:\.|,|$)',
            r'([A-Za-z][A-Za-z\s]+?)\s+(?:summit|conference|conclave|expo)\s+\d{4}',
        ]

        for pattern in event_location_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                state = self._resolve_location_to_state(match.strip())
                if state:
                    found.add(state)

        # Also check for direct city mentions in event context
        for city, state in self.CITY_STATE_MAP.items():
            if len(city) >= 4:  # Skip very short names to avoid false positives
                city_pattern = r'\b' + re.escape(city) + r'\b'
                if re.search(city_pattern, text, re.IGNORECASE):
                    # Verify it's in event context
                    context_pattern = r'(?:summit|conference|conclave|workshop|expo|hackathon|meet|forum).{0,50}' + re.escape(city)
                    alt_context = re.escape(city) + r'.{0,50}(?:summit|conference|conclave|workshop|expo|hackathon|meet|forum)'
                    if re.search(context_pattern, text, re.IGNORECASE) or re.search(alt_context, text, re.IGNORECASE):
                        found.add(state)

        return found

    def _check_investment(self, text: str) -> Set[str]:
        """
        RULE 4: Check for explicit investment/deployment tied to a state.
        """
        found = set()

        # Check if there's an investment signal
        has_investment = any(p.search(text) for p in self.compiled_investment_patterns)
        if not has_investment:
            return found

        # Extract location from investment context - capture just city/state name (1-3 words max)
        investment_location_patterns = [
            r'(?:invest(?:s|ed|ing|ment)?|infusion|funding)\s+(?:\w+\s+){0,5}(?:in|for|into)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\.|,|$|\s)',
            r'(?:invest(?:s|ed|ing|ment)?)\s+in\s+([A-Z][a-z]+)',  # Simple "investment in [City]"
            r'(?:deploy(?:s|ed|ing|ment)?|roll(?:s|ed|ing)?\s*out)\s+(?:\w+\s+){0,3}(?:in|across|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\.|,|$|\s)',
            r'(?:pilot)\s+(?:\w+\s+){0,5}(?:in|across|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\.|,|$|\s)',  # pilot ... in city
            r'(?:launch(?:es|ed|ing)?)\s+(?:in|across|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\.|,|$|\s)',  # launches in city
            r'(?:expansion|expanding)\s+(?:\w+\s+){0,3}(?:in|to|into)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\.|,|$|\s)',
        ]

        for pattern in investment_location_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                state = self._resolve_location_to_state(match.strip())
                if state:
                    found.add(state)

        return found

    def _resolve_location_to_state(self, location: str) -> Optional[str]:
        """Resolve a location name to state code, or None if not found."""
        if not location:
            return None

        location_lower = location.lower().strip()

        # Remove common suffixes
        location_lower = re.sub(r'\s+(city|district|region|area|zone)$', '', location_lower)

        # Check city map first (more specific)
        if location_lower in self.CITY_STATE_MAP:
            return self.CITY_STATE_MAP[location_lower]

        # Check state names
        if location_lower in self.STATE_NAME_MAP:
            return self.STATE_NAME_MAP[location_lower]

        # Partial match for state names (e.g., "Tamil Nadu's" -> TN)
        for state_name, state_code in self.STATE_NAME_MAP.items():
            if state_name in location_lower or location_lower in state_name:
                return state_code

        return None

    def get_state_name(self, state_code: str) -> str:
        """Get full state name from code."""
        state_names = {
            'TN': 'Tamil Nadu', 'KA': 'Karnataka', 'MH': 'Maharashtra',
            'DL': 'Delhi', 'TG': 'Telangana', 'AP': 'Andhra Pradesh',
            'WB': 'West Bengal', 'GJ': 'Gujarat', 'RJ': 'Rajasthan',
            'UP': 'Uttar Pradesh', 'KL': 'Kerala', 'PB': 'Punjab',
            'HR': 'Haryana', 'MP': 'Madhya Pradesh', 'BR': 'Bihar',
            'OD': 'Odisha', 'AS': 'Assam', 'JH': 'Jharkhand',
            'CG': 'Chhattisgarh', 'UK': 'Uttarakhand', 'GA': 'Goa',
            'HP': 'Himachal Pradesh', 'JK': 'Jammu & Kashmir',
            'MN': 'Manipur', 'ML': 'Meghalaya', 'MZ': 'Mizoram',
            'NL': 'Nagaland', 'TR': 'Tripura', 'AR': 'Arunachal Pradesh',
            'SK': 'Sikkim', 'IN': 'All India', 'PY': 'Puducherry',
            'LA': 'Ladakh', 'CH': 'Chandigarh',
        }
        return state_names.get(state_code, state_code)
