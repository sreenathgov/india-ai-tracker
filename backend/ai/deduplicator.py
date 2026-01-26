"""
Advanced Deduplication System for India AI Tracker

This module handles cross-cycle duplicate detection to prevent the same news story
from being saved multiple times when reported by different sources.

Key Design Principles:
1. SAME news item = same underlying event/announcement reported by different sources
2. DIFFERENT news items = related topics but distinct events (e.g., follow-ups, different rounds)

Detection Strategy:
- Multi-level similarity scoring using different fuzzy matching algorithms
- Entity extraction to identify key subjects (companies, amounts, locations)
- Time-window consideration (same news usually published within 48-72 hours)
- Database lookup for cross-cycle deduplication (not just in-memory)

Thresholds are calibrated to:
- CATCH: "UPC Volt sets up Rs 5k cr data centre" vs "UPC Volt to invest 5000 crore in data centre"
- ALLOW: "Startup X raises Series A" vs "Startup X raises Series B" (different events)
"""

import re
from datetime import datetime, timedelta
from fuzzywuzzy import fuzz


class Deduplicator:
    """
    Advanced deduplication with cross-cycle database awareness.

    The deduplicator uses a multi-stage approach:
    1. Exact URL match (definite duplicate)
    2. Normalized URL match (same article, different tracking params)
    3. Multi-algorithm title similarity with entity extraction
    4. Content fingerprinting for edge cases
    """

    # Similarity thresholds (calibrated through testing)
    TOKEN_SET_THRESHOLD = 88  # token_set_ratio - handles different lengths/word order
    PARTIAL_THRESHOLD = 90    # partial_ratio - when one title is subset of another
    COMBINED_THRESHOLD = 82   # weighted average of multiple algorithms

    # Rolling window for duplicate detection (days)
    # Only articles published within this window are compared for duplicates
    # This prevents expensive full-database scans and focuses on recent news
    DEDUP_WINDOW_DAYS = 14  # Configurable: compare against last 14 days only

    # Patterns to extract key entities for comparison
    AMOUNT_PATTERN = re.compile(
        r'(?:₹|rs\.?|inr|usd|\$)\s*[\d,]+(?:\.\d+)?\s*(?:crore|cr|lakh|million|mn|billion|bn|k)?',
        re.IGNORECASE
    )

    COMPANY_NAME_PATTERN = re.compile(
        r'\b(?:' + '|'.join([
            # Common AI/Tech company patterns
            r'[A-Z][a-z]+(?:AI|\.ai|tech|labs?|soft|ware|vision|mind|brain|net|cloud)',
            r'[A-Z][A-Z]+',  # Acronyms like UPC, TCS, etc.
        ]) + r')\b'
    )

    # Words to ignore when comparing (stop words + common news phrases)
    NOISE_WORDS = {
        'a', 'an', 'the', 'to', 'for', 'in', 'on', 'at', 'by', 'with', 'from',
        'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'will', 'would', 'could', 'should', 'may', 'might',
        'set', 'up', 'sets', 'setting', 'ready', 'new',
        'india', 'indian', 'indias',
        'announces', 'announced', 'announcement', 'launching', 'launches', 'launch',
        'plans', 'planning', 'planned', 'plan',
        'estimated', 'expected', 'likely', 'reportedly',
        'says', 'said', 'reports', 'reported',
    }

    def __init__(self):
        """Initialize with empty in-memory cache."""
        self.seen_urls = set()
        self.seen_normalized_urls = set()
        self.seen_titles = []  # List of (title, date, entities) tuples
        self._db_titles_loaded = False
        self._db_titles = []  # Cache of database titles

    def _normalize_url(self, url):
        """
        Normalize URL by removing tracking parameters and standardizing format.

        Examples:
        - Remove utm_*, fbclid, gclid parameters
        - Standardize http vs https
        - Remove trailing slashes
        """
        if not url:
            return ''

        # Remove common tracking parameters
        url = re.sub(r'[?&](utm_[^&]*|fbclid=[^&]*|gclid=[^&]*|ref=[^&]*)', '', url)
        # Remove trailing ? or & if no params left
        url = re.sub(r'[?&]$', '', url)
        # Standardize to lowercase domain
        url = url.lower()
        # Remove trailing slash
        url = url.rstrip('/')
        # Remove www.
        url = re.sub(r'://www\.', '://', url)

        return url

    def _extract_entities(self, text):
        """
        Extract key entities from text for semantic comparison.

        Returns a dict with:
        - amounts: list of monetary amounts mentioned
        - companies: list of company names
        - key_terms: important terms after noise removal
        """
        text_lower = text.lower()

        # Extract amounts (normalize to comparable format)
        amounts = []
        for match in self.AMOUNT_PATTERN.finditer(text):
            amt_str = match.group().lower()
            # Normalize amounts to numeric values for comparison
            amounts.append(self._normalize_amount(amt_str))

        # Extract what look like company/entity names
        companies = []
        for match in self.COMPANY_NAME_PATTERN.finditer(text):
            companies.append(match.group().lower())

        # Extract key terms (remove noise words)
        words = re.findall(r'\b[a-z]+\b', text_lower)
        key_terms = [w for w in words if w not in self.NOISE_WORDS and len(w) > 2]

        return {
            'amounts': sorted(set(amounts)),
            'companies': sorted(set(companies)),
            'key_terms': sorted(set(key_terms))
        }

    def _normalize_amount(self, amount_str):
        """
        Normalize monetary amounts to a comparable format.

        '₹5,000 crore' -> '5000cr'
        'Rs 5k cr' -> '5000cr'
        '$100 million' -> '100mn'
        """
        amount_str = amount_str.lower().replace(',', '').replace(' ', '')

        # Remove currency symbols
        amount_str = re.sub(r'[₹$]|rs\.?|inr|usd', '', amount_str)

        # Extract numeric part
        num_match = re.search(r'[\d.]+', amount_str)
        if not num_match:
            return amount_str

        num = float(num_match.group())

        # Handle multipliers
        if 'k' in amount_str and 'crore' not in amount_str and 'lakh' not in amount_str:
            num *= 1000

        # Determine unit
        if 'crore' in amount_str or 'cr' in amount_str:
            unit = 'cr'
        elif 'lakh' in amount_str:
            unit = 'lakh'
        elif 'billion' in amount_str or 'bn' in amount_str:
            unit = 'bn'
        elif 'million' in amount_str or 'mn' in amount_str:
            unit = 'mn'
        else:
            unit = ''

        return f"{int(num)}{unit}"

    def _calculate_similarity(self, title1, title2, entities1=None, entities2=None):
        """
        Calculate comprehensive similarity score between two titles.

        Uses multiple algorithms and entity comparison:
        1. token_set_ratio: Best for different lengths and word orders
        2. partial_ratio: Good when one title is a subset
        3. token_sort_ratio: Ignores word order completely
        4. Entity overlap: Companies and amounts mentioned

        CRITICAL: Must handle cases where similar templates are used for different events:
        - "Startup X raises $10M Series A" vs "Startup X raises $50M Series B" = DIFFERENT
        - "Google launches AI" vs "Microsoft launches AI" = DIFFERENT

        Returns:
            float: Similarity score 0-100
            str: Reason if considered duplicate, None if not a duplicate
        """
        t1_lower = title1.lower()
        t2_lower = title2.lower()

        # Calculate various fuzzy ratios
        token_set = fuzz.token_set_ratio(t1_lower, t2_lower)
        partial = fuzz.partial_ratio(t1_lower, t2_lower)
        token_sort = fuzz.token_sort_ratio(t1_lower, t2_lower)
        basic = fuzz.ratio(t1_lower, t2_lower)

        # Weighted average (token_set is most reliable for news titles)
        weighted_avg = (token_set * 0.4 + partial * 0.25 + token_sort * 0.25 + basic * 0.1)

        # ============================================================
        # CRITICAL: Check for differentiating factors FIRST
        # These are signals that despite similar text, the articles
        # are about DIFFERENT events and should NOT be deduplicated
        # ============================================================

        if entities1 and entities2:
            # DIFFERENT AMOUNTS = Different events (e.g., Series A vs Series B)
            if entities1['amounts'] and entities2['amounts']:
                # Both mention amounts but they're different
                if set(entities1['amounts']) != set(entities2['amounts']):
                    # Check if amounts are significantly different (not just formatting)
                    if not self._amounts_are_similar(entities1['amounts'], entities2['amounts']):
                        return weighted_avg, None  # NOT a duplicate

            # DIFFERENT MAJOR ENTITIES = Different subjects
            # Extract proper nouns / named entities (not generic terms)
            key1 = self._extract_distinguishing_terms(t1_lower, entities1)
            key2 = self._extract_distinguishing_terms(t2_lower, entities2)

            if key1 and key2:
                # If both have distinguishing terms but they don't overlap much
                common_key = key1 & key2
                all_key = key1 | key2

                if len(all_key) >= 2:  # Both have distinguishing terms
                    overlap = len(common_key) / len(all_key)
                    if overlap < 0.3:  # Less than 30% overlap in key entities
                        return weighted_avg, None  # NOT a duplicate

        # ============================================================
        # Now check for duplicate signals
        # ============================================================

        # Entity-based boost for similarity
        entity_adjustment = 0
        reason = None

        if entities1 and entities2:
            # Check amount similarity (not just exact match, but similar values)
            if entities1['amounts'] and entities2['amounts']:
                if self._amounts_are_similar(entities1['amounts'], entities2['amounts']):
                    entity_adjustment += 8
                    reason = f"Similar amounts mentioned"

            # Check key term overlap ratio
            if entities1['key_terms'] and entities2['key_terms']:
                common_terms = set(entities1['key_terms']) & set(entities2['key_terms'])
                total_terms = set(entities1['key_terms']) | set(entities2['key_terms'])
                overlap_ratio = len(common_terms) / len(total_terms) if total_terms else 0

                # Lower threshold since we want to catch similar news
                if overlap_ratio > 0.50:
                    entity_adjustment += int(overlap_ratio * 15)  # Up to 15 points
                    if not reason:
                        reason = f"Term overlap ({overlap_ratio:.0%})"
                    else:
                        reason += f", term overlap ({overlap_ratio:.0%})"

        final_score = min(100, weighted_avg + entity_adjustment)

        # Determine if it's a duplicate - use STRICTER thresholds
        # but also consider entity-based evidence

        # High token_set with entity support = likely duplicate even with low basic ratio
        if token_set >= self.TOKEN_SET_THRESHOLD:
            if basic >= 70:
                # High token_set AND decent basic ratio = likely duplicate
                return final_score, f"Token set ratio {token_set}% >= {self.TOKEN_SET_THRESHOLD}% (basic: {basic}%)"
            elif reason:
                # High token_set AND entity match (same amounts/high term overlap)
                return final_score, f"Token set {token_set}% with {reason}"

        if partial >= self.PARTIAL_THRESHOLD and token_sort >= 80:
            # High partial AND high token_sort = one is subset of other
            return final_score, f"Partial ratio {partial}% >= {self.PARTIAL_THRESHOLD}%"

        if final_score >= self.COMBINED_THRESHOLD + 5 and reason:
            # Combined score with entity confirmation
            return final_score, reason

        return final_score, None

    def _amounts_are_similar(self, amounts1, amounts2):
        """
        Check if two sets of amounts are similar (accounting for formatting differences).

        '5000cr' and '5000' might be the same amount with different formatting.
        '10mn' and '50mn' are clearly different.

        IMPORTANT: We want to return True if amounts COULD be the same,
        which means we should NOT block deduplication.
        """
        # Normalize amounts to just numbers for comparison
        def extract_number(amt):
            num_match = re.search(r'\d+', str(amt))
            return int(num_match.group()) if num_match else 0

        nums1 = {extract_number(a) for a in amounts1}
        nums2 = {extract_number(a) for a in amounts2}

        # Remove zeros (failed parses)
        nums1 = {n for n in nums1 if n > 0}
        nums2 = {n for n in nums2 if n > 0}

        if not nums1 or not nums2:
            return True  # Can't determine, don't block

        # If any numbers match exactly, consider them similar
        if nums1 & nums2:
            return True

        # If numbers are within 20% of each other, might be same amount
        # (allows for rounding: 5k vs 5000, Rs 5,000 vs ₹5000)
        for n1 in nums1:
            for n2 in nums2:
                ratio = min(n1, n2) / max(n1, n2)
                if ratio > 0.8:  # Within 20%
                    return True

        return False

    def _extract_distinguishing_terms(self, text, entities):
        """
        Extract terms that distinguish one article from another.

        These are typically:
        - Company/organization names (Google, Microsoft, Infosys)
        - Person names
        - Specific product names
        - Location-specific terms (not generic like 'India')
        """
        distinguishing = set()

        # Add non-generic key terms (longer than 4 chars, not common words)
        common_generic = {
            'india', 'indian', 'startup', 'company', 'funding', 'raises',
            'million', 'crore', 'series', 'round', 'investment', 'launches',
            'announces', 'plans', 'model', 'platform', 'technology', 'digital',
            'artificial', 'intelligence', 'machine', 'learning', 'data',
            'centre', 'center', 'global', 'first', 'latest', 'biggest',
            'healthcare', 'health', 'care', 'sector', 'industry',
        }

        # Known major companies - if these differ, articles are different
        known_companies = {
            'google', 'microsoft', 'amazon', 'meta', 'facebook', 'apple',
            'nvidia', 'openai', 'anthropic', 'ibm', 'oracle', 'salesforce',
            'infosys', 'tcs', 'wipro', 'hcl', 'tech mahindra', 'cognizant',
            'reliance', 'tata', 'adani', 'airtel', 'jio', 'paytm', 'flipkart',
            'zomato', 'swiggy', 'ola', 'uber', 'byju', 'unacademy',
        }

        for term in entities.get('key_terms', []):
            # Check if it's a known company name
            if term.lower() in known_companies:
                distinguishing.add(term.lower())
            elif len(term) > 4 and term not in common_generic:
                distinguishing.add(term)

        # Look for capitalized words in original text (proper nouns)
        # These are strong distinguishing signals
        words = text.split()
        for i, word in enumerate(words):
            clean_word = re.sub(r'[^\w]', '', word).lower()
            # Check if it's a known company
            if clean_word in known_companies:
                distinguishing.add(clean_word)
            # Skip first word (often capitalized regardless)
            elif i > 0 and len(clean_word) > 3 and clean_word not in common_generic:
                distinguishing.add(clean_word)

        return distinguishing

    def _load_database_titles(self, lookback_days=None):
        """
        Load recent titles from database for cross-cycle deduplication.

        Uses a rolling window approach: only articles from the last N days are
        compared for duplicates. This prevents expensive full-database scans
        and focuses on recent news events.

        Args:
            lookback_days: Number of days to look back (defaults to DEDUP_WINDOW_DAYS)
        """
        if self._db_titles_loaded:
            return

        # Use class constant if not specified
        if lookback_days is None:
            lookback_days = self.DEDUP_WINDOW_DAYS

        try:
            from app import app, db, Update

            with app.app_context():
                # Calculate cutoff date for rolling window
                cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

                # Query only articles within the rolling window
                # NOTE: This query requires an index on date_scraped for performance
                recent_updates = Update.query.filter(
                    Update.date_scraped >= cutoff_date,
                    (Update.is_deleted == False) | (Update.is_deleted == None)
                ).order_by(Update.date_scraped.desc()).all()

                for update in recent_updates:
                    entities = self._extract_entities(update.title)
                    self._db_titles.append({
                        'title': update.title,
                        'url': update.url,
                        'date': update.date_scraped,
                        'entities': entities
                    })
                    self.seen_urls.add(update.url)
                    self.seen_normalized_urls.add(self._normalize_url(update.url))

                print(f"  [DEDUP] Loaded {len(self._db_titles)} titles from database")
                print(f"  [DEDUP] Rolling window: Last {lookback_days} days (from {cutoff_date.date()} onwards)")
                self._db_titles_loaded = True

        except Exception as e:
            print(f"  [DEDUP] Warning: Could not load database titles: {e}")
            self._db_titles_loaded = True  # Don't retry on error

    def is_duplicate(self, url, title, date_published=None, content=None):
        """
        Check if an article is a duplicate of an existing one.

        This method checks:
        1. Exact URL match (including normalized URLs)
        2. Title similarity against in-memory cache (current scrape cycle)
        3. Title similarity against database (previous scrape cycles)

        Args:
            url: Article URL
            title: Article title
            date_published: Publication date (optional, for time-window filtering)
            content: Article content (optional, for deeper analysis)

        Returns:
            bool: True if duplicate, False otherwise
        """
        # Load database titles on first call
        self._load_database_titles()

        # Level 1: Exact URL match
        if url in self.seen_urls:
            print(f"  [DEDUP] Exact URL duplicate: {title[:50]}...")
            return True

        # Level 2: Normalized URL match
        normalized_url = self._normalize_url(url)
        if normalized_url in self.seen_normalized_urls:
            print(f"  [DEDUP] Normalized URL duplicate: {title[:50]}...")
            return True

        # Extract entities from current title
        current_entities = self._extract_entities(title)

        # Level 3: Check against database titles (cross-cycle)
        for db_entry in self._db_titles:
            score, reason = self._calculate_similarity(
                title,
                db_entry['title'],
                current_entities,
                db_entry['entities']
            )

            if reason:  # reason is set only when it's a duplicate
                print(f"  [DEDUP] Cross-cycle duplicate detected!")
                print(f"          New:      {title[:60]}...")
                print(f"          Existing: {db_entry['title'][:60]}...")
                print(f"          Reason:   {reason}")
                return True

        # Level 4: Check against in-memory cache (current cycle)
        for cached in self.seen_titles:
            score, reason = self._calculate_similarity(
                title,
                cached['title'],
                current_entities,
                cached['entities']
            )

            if reason:
                print(f"  [DEDUP] In-cycle duplicate detected!")
                print(f"          New:      {title[:60]}...")
                print(f"          Existing: {cached['title'][:60]}...")
                print(f"          Reason:   {reason}")
                return True

        # Not a duplicate - add to seen lists
        self.seen_urls.add(url)
        self.seen_normalized_urls.add(normalized_url)
        self.seen_titles.append({
            'title': title,
            'url': url,
            'date': date_published or datetime.utcnow(),
            'entities': current_entities
        })

        return False

    def get_stats(self):
        """Return deduplication statistics."""
        return {
            'urls_seen': len(self.seen_urls),
            'titles_in_memory': len(self.seen_titles),
            'titles_from_db': len(self._db_titles),
            'db_loaded': self._db_titles_loaded
        }


# Utility function for testing similarity
def test_similarity(title1, title2):
    """
    Test function to check similarity between two titles.
    Useful for calibrating thresholds.
    """
    dedup = Deduplicator()
    entities1 = dedup._extract_entities(title1)
    entities2 = dedup._extract_entities(title2)

    print(f"\nTitle 1: {title1}")
    print(f"Title 2: {title2}")
    print(f"\nEntities 1: {entities1}")
    print(f"Entities 2: {entities2}")

    score, reason = dedup._calculate_similarity(title1, title2, entities1, entities2)

    print(f"\nSimilarity Score: {score:.1f}")
    print(f"Is Duplicate: {'Yes' if reason else 'No'}")
    if reason:
        print(f"Reason: {reason}")

    # Also print individual algorithm scores
    print(f"\nDetailed scores:")
    print(f"  token_set_ratio:  {fuzz.token_set_ratio(title1.lower(), title2.lower())}")
    print(f"  partial_ratio:    {fuzz.partial_ratio(title1.lower(), title2.lower())}")
    print(f"  token_sort_ratio: {fuzz.token_sort_ratio(title1.lower(), title2.lower())}")
    print(f"  basic ratio:      {fuzz.ratio(title1.lower(), title2.lower())}")

    return score, reason


if __name__ == '__main__':
    # Test with the problematic UPC Volt titles
    print("=" * 70)
    print("TEST 1: Same news from different sources (SHOULD BE DUPLICATE)")
    print("=" * 70)
    test_similarity(
        "UPC Volt to set up Rs 5k cr AI-ready data centre in Bharat Future City",
        "UPC Volt to set up AI ready data centre at Telangana's Bharat Future City; ₹5,000 crore investment over 5 years estimated"
    )

    print("\n" + "=" * 70)
    print("TEST 2: Same company, different events (SHOULD NOT BE DUPLICATE)")
    print("=" * 70)
    test_similarity(
        "Startup X raises $10 million in Series A funding",
        "Startup X raises $50 million in Series B funding round"
    )

    print("\n" + "=" * 70)
    print("TEST 3: Same topic, different companies (SHOULD NOT BE DUPLICATE)")
    print("=" * 70)
    test_similarity(
        "Google launches new AI model for healthcare",
        "Microsoft launches new AI model for healthcare"
    )

    print("\n" + "=" * 70)
    print("TEST 4: Follow-up article (SHOULD NOT BE DUPLICATE)")
    print("=" * 70)
    test_similarity(
        "Karnataka announces AI policy framework",
        "Karnataka AI policy framework implementation begins"
    )

    print("\n" + "=" * 70)
    print("TEST 5: Near-identical with minor word changes (SHOULD BE DUPLICATE)")
    print("=" * 70)
    test_similarity(
        "Telangana rolls out global AI innovation entity Aikam",
        "Telangana launches global AI innovation entity Aikam"
    )
