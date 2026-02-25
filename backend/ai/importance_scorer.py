"""
Importance Scorer for Layer 3 Premium Processing — v2

10-signal scoring model (0-100) to select the most significant articles
for Gemini premium refinement. Designed to work on title + summary.

Scoring Model (10 dimensions, max theoretical 140, capped at 100):

  1. Category Base        10-30 pts  (policy highest, events lowest)
  2. Geographic Scope      5-15 pts  (multi-state > national > single)
  3. Government Authority  0-20 pts  (3 tiers: parliament → ministry → regulator)
  4. Academic & Research   0-15 pts  (pattern-based for ALL institution types + sector boost)
  5. Industry & Corporate  0-10 pts  (incumbent and challenger company mentions)
  6. Funding Signal        0-15 pts  (3 tiers: large → notable → any mention)
  7. International Signal  0-10 pts  (MoU, bilateral, G20, etc.)
  8. Infrastructure        0-10 pts  (data centre, GPU, semiconductor, AI missions)
  9. Recency Bonus         0-10 pts  (today → yesterday → 2-3 days → older)
 10. Article Substance     0-5  pts  (summary depth + entity complexity)

Premium threshold: 35 points

Usage:
    from ai.importance_scorer import ImportanceScorer
    scorer = ImportanceScorer()
    result = scorer.calculate_score(article_dict)
"""

import re
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List


class ImportanceScorer:
    """
    10-signal importance scorer for article-level premium selection.

    Scores from title + summary (not raw content, which is typically
    empty from RSS feeds). Covers government, academic, corporate,
    funding, infrastructure, and international dimensions.
    """

    PREMIUM_THRESHOLD = 35

    def __init__(self, config_path: str = None):
        """
        Initialize importance scorer.

        Args:
            config_path: Unused (kept for API compatibility).
        """
        self._compile_patterns()

    # ──────────────────────────────────────────────────────────────────────
    # PATTERN COMPILATION (all regex compiled once at startup)
    # ──────────────────────────────────────────────────────────────────────

    def _compile_patterns(self):
        """Compile all regex patterns for efficient repeated use."""

        # ── Signal 3: Government & Authority ──────────────────────────────

        # Tier 1 (20 pts): Parliament, PM, Union Government, Supreme Court
        self.govt_tier1 = re.compile(
            r'\b('
            r'parliament|lok sabha|rajya sabha|'
            r'prime minister|pm modi|pm narendra|'
            r'union government|central government|government of india|'
            r'union budget|central budget|union cabinet|'
            r'niti aayog|supreme court|president of india'
            r')\b',
            re.IGNORECASE
        )

        # Tier 2 (15 pts): Ministry, State CM, MeitY
        self.govt_tier2 = re.compile(
            r'\b('
            r'ministry of|minister |meity|meit\b|'
            r'chief minister|cm [a-z]|'
            r'state government|state govt|'
            r'deity|dit\b|'
            r'election commission|attorney general'
            r')\b',
            re.IGNORECASE
        )

        # Tier 3 (10 pts): Regulatory bodies, departments
        self.govt_tier3 = re.compile(
            r'\b('
            r'rbi|reserve bank|sebi|trai|irdai|'
            r'ncert|ugc|aicte|'
            r'department of|directorate|'
            r'municipal|smart city|corporation\b|'
            r'district collector|commissioner'
            r')\b',
            re.IGNORECASE
        )

        # ── Signal 4: Academic & Research ─────────────────────────────────
        # Pattern-based to cover ALL Indian institutions without listing each

        # Premier institutions (15 pts)
        # Matches: "IIT Madras", "IIT-B", "IITs", "IISc", "IIM Ahmedabad", etc.
        self.research_premier = re.compile(
            r'\b('
            r'iit[- ]?\w+|iits\b|iit\b|'       # All 23 IITs
            r'iisc\b|'                             # IISc Bangalore
            r'iim[- ]?\w+|iims\b|iim\b|'         # All 20 IIMs
            r'aiims[- ]?\w*|aiims\b|'             # All AIIMS
            r'isro|drdo|csir|tifr|'               # National labs
            r'barc|icar|icmr|dae\b|'              # Research bodies
            r'isi kolkata|isi\b|'                  # Indian Statistical Institute
            r'nasscom|dsci'                        # Industry bodies
            r')\b',
            re.IGNORECASE
        )

        # Named institution patterns (10 pts)
        # Matches: "NIT Trichy", "IIIT Hyderabad", "BITS Pilani", etc.
        self.research_named = re.compile(
            r'\b('
            r'nit[- ]?\w+|nits\b|nit\b|'         # All 31 NITs
            r'iiit[- ]?\w+|iiits\b|iiit\b|'      # All 59+ IIITs
            r'iiser[- ]?\w*|iisers\b|'            # All 7 IISERs
            r'bits[- ]?\w*|bits\b|'               # BITS campuses
            r'niser\b|'                            # NISER
            r'indian institute of|'                # Generic IIx pattern
            r'indian statistical|'
            r'jadavpur|anna university|osmania|'
            r'amity|manipal|vit\b|srm\b|'         # Major private
            r'symbiosis|ashoka university|'
            r'iiitd\b|iiitb\b|iiith\b'            # IIIT short forms
            r')\b',
            re.IGNORECASE
        )

        # Generic academic patterns (5 pts)
        self.research_generic = re.compile(
            r'\b('
            r'university|universities|'
            r'research centre|research center|research lab|'
            r'research institute|research facility|'
            r'professor|faculty|'
            r'ph\.?d|doctoral|postdoctoral|'
            r'academic|peer.reviewed|published paper|'
            r'innovation hub|incubat(?:or|ion)|'
            r'centre of excellence|center of excellence'
            r')\b',
            re.IGNORECASE
        )

        # ── Signal 5: Industry & Corporate ────────────────────────────────
        # Matches major Indian and global companies active in AI

        self.industry_pattern = re.compile(
            r'\b('
            # Major Indian tech / conglomerates
            r'infosys|tcs\b|tata consultancy|wipro|'
            r'hcl tech|tech mahindra|'
            r'reliance|jio\b|tata group|tata sons|'
            r'adani|mahindra|l&t\b|larsen|'
            r'bharti|airtel|'
            r'hdfc|icici|sbi\b|bajaj|axis bank|'
            r'vedanta|jsw|godrej|'
            r'zoho|freshworks|'
            r'ola\b|flipkart|paytm|phonepe|razorpay|cred\b|'
            r'swiggy|zomato|'
            r'byju|upgrad|unacademy|'
            # Global companies with India presence
            r'google india|microsoft india|amazon india|aws india|'
            r'meta india|ibm india|sap labs|samsung india|'
            r'intel india|nvidia|apple india|qualcomm india|'
            r'accenture india|deloitte india|oracle india|'
            r'cisco india|dell india|salesforce india|'
            # Match standalone when context is clearly Indian
            r'google|microsoft|amazon|meta\b|ibm\b|'
            r'nvidia|apple|samsung|intel\b|oracle|cisco'
            r')\b',
            re.IGNORECASE
        )

        # ── Signal 6: Funding ─────────────────────────────────────────────

        # Tier 1: Large (≥ ₹50 crore or $5M+)
        self.funding_large = [
            re.compile(r'[₹rs\.]{1,3}\s*([5-9]\d|\d{3,})\s*crore', re.IGNORECASE),
            re.compile(r'\$\s*([5-9]\d*|\d{2,})\s*million', re.IGNORECASE),
            re.compile(r'\$\s*\d+\.?\d*\s*billion', re.IGNORECASE),
            re.compile(r'[₹rs\.]{1,3}\s*\d+\.?\d*\s*billion', re.IGNORECASE),
        ]

        # Tier 2: Notable (₹10-49 crore or $1-4M)
        self.funding_notable = [
            re.compile(r'[₹rs\.]{1,3}\s*([1-4]\d)\s*crore', re.IGNORECASE),
            re.compile(r'\$\s*([1-4])\s*million', re.IGNORECASE),
        ]

        # Tier 3: Any funding mention
        self.funding_any = re.compile(
            r'\b('
            r'seed round|pre-seed|angel round|angel funding|'
            r'series [a-e]|'
            r'raised|funding round|fund raise|'
            r'investment round|venture capital|'
            r'valuation|unicorn'
            r')\b',
            re.IGNORECASE
        )

        # ── Signal 7: International ───────────────────────────────────────
        self.international_pattern = re.compile(
            r'\b('
            r'mou\b|memorandum of understanding|bilateral|multilateral|'
            r'us-india|india-us|uk-india|india-uk|'
            r'japan|germany|france|australia|canada|singapore|'
            r'south korea|israel|uae|saudi|'
            r'world bank|imf|united nations|g20|g7|'
            r'european union|asean|brics|quad\b|'
            r'global partnership|international collaboration'
            r')\b',
            re.IGNORECASE
        )

        # ── Signal 8: Infrastructure & Compute ────────────────────────────
        self.infra_pattern = re.compile(
            r'\b('
            r'data cent(?:re|er)|gpu|tpu|'
            r'semiconductor|chip\b|fab\b|fabrication|'
            r'computing infrastructure|cloud infrastructure|'
            r'server farm|hyperscale|'
            r'india ai mission|indiaai|digital india|'
            r'bharatgpt|bhashini|airawat|'
            r'supercomputer|param\b|'
            r'national ai mission|national ai portal|ai portal|'
            r'5g\b|fibre\b|fiber\b|'
            r'smart city|digital infrastructure|'
            r'ai compute|compute capacity'
            r')\b',
            re.IGNORECASE
        )

    # ──────────────────────────────────────────────────────────────────────
    # RECENCY BONUS
    # ──────────────────────────────────────────────────────────────────────

    def _get_recency_bonus(self, article: Dict[str, Any]) -> int:
        """
        Calculate recency bonus based on publication date.

        Returns 10, 7, 4, or 0 depending on how fresh the article is.
        """
        date_published = article.get('date_published', '')
        if not date_published:
            return 0

        try:
            if isinstance(date_published, str):
                try:
                    pub_dt = datetime.fromisoformat(
                        date_published.replace('Z', '+00:00')
                    )
                except ValueError:
                    pub_dt = datetime.strptime(
                        date_published[:10], '%Y-%m-%d'
                    ).replace(tzinfo=timezone.utc)
            elif isinstance(date_published, datetime):
                pub_dt = date_published
                if pub_dt.tzinfo is None:
                    pub_dt = pub_dt.replace(tzinfo=timezone.utc)
            else:
                return 0

            now = datetime.now(timezone.utc)
            age_days = (now - pub_dt).days

            if age_days == 0:
                return 10
            elif age_days == 1:
                return 7
            elif age_days <= 3:
                return 4
            else:
                return 0

        except (ValueError, TypeError):
            return 0

    # ──────────────────────────────────────────────────────────────────────
    # MAIN SCORING ENGINE
    # ──────────────────────────────────────────────────────────────────────

    def calculate_score(
        self,
        article: Dict[str, Any],
        layer1_results: Dict[str, Any] = None,
        layer2_results: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Calculate importance score for an article using 10 signal dimensions.

        Args:
            article: Dict with 'title', 'summary', 'category',
                     'state_codes', 'date_published', 'sector', etc.
            layer1_results: Unused (API compatibility)
            layer2_results: Unused (API compatibility)

        Returns:
            Dict with:
                importance_score (int): 0-100
                breakdown (dict): Points by each signal dimension
                is_premium_worthy (bool): Score >= 35
        """
        # Manual overrides take absolute priority
        if article.get('force_premium'):
            return {
                'importance_score': 999,
                'breakdown': {'manual_override': 'force_premium'},
                'is_premium_worthy': True
            }
        if article.get('skip_premium'):
            return {
                'importance_score': -999,
                'breakdown': {'manual_override': 'skip_premium'},
                'is_premium_worthy': False
            }

        score = 0
        breakdown = {}

        # Build search text from title + summary
        title = article.get('title', '')
        summary = article.get('summary', '')
        text = f"{title} {summary}"
        text_lower = text.lower()

        # ── 1. CATEGORY BASE (10-30 pts) ──────────────────────────────────
        category = article.get('category', '')
        category_scores = {
            'Policies and Initiatives': 30,
            'Major AI Developments': 20,
            'AI Start-Up News': 20,
            'Events': 10,
        }
        base = category_scores.get(category, 10)
        score += base
        breakdown['category_base'] = base

        # ── 2. GEOGRAPHIC SCOPE (5-15 pts) ────────────────────────────────
        state_codes = article.get('state_codes', [])
        if isinstance(state_codes, str):
            try:
                state_codes = json.loads(state_codes)
            except (json.JSONDecodeError, ValueError):
                state_codes = []
        if not isinstance(state_codes, list):
            state_codes = []

        if len(state_codes) > 2:
            geo_pts = 15
            breakdown['geo_scope'] = 'multi_state'
        elif 'IN' in state_codes:
            geo_pts = 10
            breakdown['geo_scope'] = 'national'
        elif len(state_codes) >= 1:
            geo_pts = 5
            breakdown['geo_scope'] = 'single_state'
        else:
            geo_pts = 0
            breakdown['geo_scope'] = 'none'

        score += geo_pts
        breakdown['geo_pts'] = geo_pts

        # ── 3. GOVERNMENT & AUTHORITY (0-20 pts, pick highest tier) ───────
        govt_pts = 0
        if self.govt_tier1.search(text):
            govt_pts = 20
            breakdown['govt_tier'] = 1
        elif self.govt_tier2.search(text):
            govt_pts = 15
            breakdown['govt_tier'] = 2
        elif self.govt_tier3.search(text):
            govt_pts = 10
            breakdown['govt_tier'] = 3

        score += govt_pts
        breakdown['govt_pts'] = govt_pts

        # ── 4. ACADEMIC & RESEARCH (0-15 pts, pick highest + sector boost)
        research_pts = 0
        if self.research_premier.search(text):
            research_pts = 15
            breakdown['research_tier'] = 'premier'
        elif self.research_named.search(text):
            research_pts = 10
            breakdown['research_tier'] = 'named'
        elif self.research_generic.search(text):
            research_pts = 5
            breakdown['research_tier'] = 'generic'

        # Sector boost: if Groq tagged this as a research article
        sector = article.get('sector', '')
        if sector == 'research' and research_pts < 15:
            research_pts = min(research_pts + 5, 15)
            breakdown['research_sector_boost'] = True

        score += research_pts
        breakdown['research_pts'] = research_pts

        # ── 5. INDUSTRY & CORPORATE (0-10 pts) ───────────────────────────
        industry_pts = 0
        if self.industry_pattern.search(text):
            industry_pts = 10
            breakdown['industry_match'] = True

        score += industry_pts
        breakdown['industry_pts'] = industry_pts

        # ── 6. FUNDING SIGNAL (0-15 pts, pick highest tier) ──────────────
        funding_pts = 0
        if any(p.search(text) for p in self.funding_large):
            funding_pts = 15
            breakdown['funding_tier'] = 'large'
        elif any(p.search(text) for p in self.funding_notable):
            funding_pts = 10
            breakdown['funding_tier'] = 'notable'
        elif self.funding_any.search(text):
            funding_pts = 5
            breakdown['funding_tier'] = 'any'

        score += funding_pts
        breakdown['funding_pts'] = funding_pts

        # ── 7. INTERNATIONAL SIGNAL (0-10 pts) ───────────────────────────
        intl_pts = 0
        if self.international_pattern.search(text):
            intl_pts = 10
            breakdown['international'] = True

        score += intl_pts
        breakdown['intl_pts'] = intl_pts

        # ── 8. INFRASTRUCTURE & COMPUTE (0-10 pts) ───────────────────────
        infra_pts = 0
        if self.infra_pattern.search(text):
            infra_pts = 10
            breakdown['infrastructure'] = True

        score += infra_pts
        breakdown['infra_pts'] = infra_pts

        # ── 9. RECENCY BONUS (0-10 pts) ──────────────────────────────────
        recency_pts = self._get_recency_bonus(article)
        score += recency_pts
        breakdown['recency_pts'] = recency_pts

        # ── 10. ARTICLE SUBSTANCE (0-5 pts) ──────────────────────────────
        substance_pts = 0
        summary_len = len(summary)
        if summary_len >= 200:
            substance_pts += 3
        elif summary_len >= 100:
            substance_pts += 2

        # Multiple entities = more complex, substantial article
        entity_count = len(state_codes)
        # Count distinct signal hits as a proxy for entity richness
        signals_hit = sum(1 for k in ['govt_pts', 'research_pts', 'industry_pts',
                                       'funding_pts', 'intl_pts', 'infra_pts']
                          if breakdown.get(k, 0) > 0)
        if entity_count >= 2 or signals_hit >= 3:
            substance_pts += 2

        substance_pts = min(substance_pts, 5)
        score += substance_pts
        breakdown['substance_pts'] = substance_pts

        # ── FINAL SCORE ──────────────────────────────────────────────────
        score = min(score, 100)

        return {
            'importance_score': score,
            'breakdown': breakdown,
            'is_premium_worthy': score >= self.PREMIUM_THRESHOLD
        }

    def rank_articles(
        self,
        articles: List[Dict[str, Any]],
        top_n: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Rank articles by importance and return top N.

        Args:
            articles: List of article dicts
            top_n: Number of top articles to return

        Returns:
            List of top N articles with scores, sorted by score descending
        """
        scored = []
        for article in articles:
            score_result = self.calculate_score(
                article,
                layer1_results=article.get('layer1_results'),
                layer2_results=article.get('layer2_results')
            )
            scored.append({**article, **score_result})

        scored.sort(key=lambda x: x['importance_score'], reverse=True)
        return scored[:top_n]


# ══════════════════════════════════════════════════════════════════════════
# TEST SUITE
# ══════════════════════════════════════════════════════════════════════════

def test_importance_scorer():
    """Test importance scorer with diverse articles covering all 10 signals."""
    print("\n" + "=" * 70)
    print("IMPORTANCE SCORER v2 TEST — 10-Signal Model")
    print("=" * 70 + "\n")

    scorer = ImportanceScorer()

    test_articles = [
        {
            'id': 1,
            'title': 'PM Modi announces ₹500 crore AI fund at India AI Summit',
            'summary': 'Prime Minister Narendra Modi announced a ₹500 crore fund for artificial intelligence development at the India AI Impact Summit in New Delhi. The fund will support startups and research institutions working on foundation models and AI infrastructure.',
            'category': 'Policies and Initiatives',
            'state_codes': ['IN'],
            'sector': 'govtech',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 2,
            'title': 'Karnataka launches AI skilling scheme across 50 colleges',
            'summary': 'Karnataka government allocates ₹200 crore for AI training across 50 colleges in partnership with NASSCOM. Chief Minister Siddaramaiah said this positions Karnataka as India\'s AI talent hub.',
            'category': 'Policies and Initiatives',
            'state_codes': ['KA'],
            'sector': 'edtech',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 3,
            'title': 'IIT Madras and IISc launch joint AI research centre',
            'summary': 'IIT Madras and IISc Bangalore announced a joint research centre for healthcare AI diagnostics. The centre will focus on medical imaging, drug discovery, and clinical AI applications.',
            'category': 'Major AI Developments',
            'state_codes': ['TN', 'KA'],
            'sector': 'research',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 4,
            'title': 'Bengaluru AI startup raises $20 million Series B',
            'summary': 'Bengaluru-based AI fintech startup SecureAI raised $20 million in Series B funding led by Sequoia Capital. The company provides AI-powered fraud detection for banks and NBFCs.',
            'category': 'AI Start-Up News',
            'state_codes': ['KA'],
            'sector': 'fintech',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 5,
            'title': 'India signs AI MoU with Japan for semiconductor supply',
            'summary': 'India and Japan signed a bilateral MoU for AI research collaboration and semiconductor chip supply chain development. The agreement includes GPU manufacturing partnership.',
            'category': 'Major AI Developments',
            'state_codes': ['IN'],
            'sector': 'enterprise',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 6,
            'title': 'NIT Trichy students win national AI hackathon',
            'summary': 'Students from NIT Trichy won the national AI hackathon with a healthcare diagnostic tool. The university team beat 500 teams from across India.',
            'category': 'Events',
            'state_codes': ['TN'],
            'sector': 'research',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 7,
            'title': 'Google India opens new AI research lab in Bengaluru',
            'summary': 'Google India has opened a new AI research lab in Bengaluru focused on multilingual NLP and Indic language models.',
            'category': 'Major AI Developments',
            'state_codes': ['KA'],
            'sector': 'enterprise',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 8,
            'title': 'Local AI meetup in Pune',
            'summary': 'Pune startup community hosts monthly AI networking event.',
            'category': 'Events',
            'state_codes': ['MH'],
            'sector': 'general',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 9,
            'title': 'SEBI proposes AI framework for algorithmic trading',
            'summary': 'The Securities and Exchange Board of India proposes a new framework for AI-powered algorithmic trading, requiring compliance audits and transparency measures.',
            'category': 'Policies and Initiatives',
            'state_codes': ['IN'],
            'sector': 'fintech',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 10,
            'title': 'Reliance Jio partners with Nvidia on AI data centres',
            'summary': 'Reliance Jio has partnered with Nvidia to build AI-optimized data centres across India. The partnership will deploy GPU clusters for AI compute capacity.',
            'category': 'Major AI Developments',
            'state_codes': ['IN'],
            'sector': 'enterprise',
            'date_published': datetime.now(timezone.utc).isoformat()
        },
    ]

    print("Scoring 10 test articles across all signal dimensions...\n")
    print(f"{'':>3} {'Score':>5}  {'Status':<10} {'Title'}")
    print("-" * 75)

    results = []
    for article in test_articles:
        result = scorer.calculate_score(article)
        results.append((article, result))
        status = "PREMIUM" if result['is_premium_worthy'] else "routine"
        marker = "✅" if result['is_premium_worthy'] else "  "
        print(f"{marker} {result['importance_score']:>5}  {status:<10} {article['title'][:55]}")

    print("\n" + "=" * 70)
    print("DETAILED BREAKDOWNS")
    print("=" * 70 + "\n")

    for article, result in results:
        print(f"Article {article['id']}: {article['title'][:60]}")
        bd = result['breakdown']
        signals = []
        if bd.get('category_base', 0) > 0:
            signals.append(f"cat:{bd['category_base']}")
        if bd.get('geo_pts', 0) > 0:
            signals.append(f"geo:{bd['geo_pts']}")
        if bd.get('govt_pts', 0) > 0:
            signals.append(f"govt:{bd['govt_pts']}(T{bd.get('govt_tier', '?')})")
        if bd.get('research_pts', 0) > 0:
            signals.append(f"research:{bd['research_pts']}")
        if bd.get('industry_pts', 0) > 0:
            signals.append(f"industry:{bd['industry_pts']}")
        if bd.get('funding_pts', 0) > 0:
            signals.append(f"funding:{bd['funding_pts']}")
        if bd.get('intl_pts', 0) > 0:
            signals.append(f"intl:{bd['intl_pts']}")
        if bd.get('infra_pts', 0) > 0:
            signals.append(f"infra:{bd['infra_pts']}")
        if bd.get('recency_pts', 0) > 0:
            signals.append(f"recency:{bd['recency_pts']}")
        if bd.get('substance_pts', 0) > 0:
            signals.append(f"substance:{bd['substance_pts']}")
        print(f"  → {' + '.join(signals)} = {result['importance_score']}")
        print()

    print("=" * 70)
    print("TOP 5 BY IMPORTANCE")
    print("=" * 70)
    top_articles = scorer.rank_articles(test_articles, top_n=5)
    for i, article in enumerate(top_articles, 1):
        print(f"  {i}. [{article['importance_score']} pts] {article['title'][:60]}")

    print(f"\n✅ Importance scorer v2 test complete!")
    print(f"   Premium threshold: {ImportanceScorer.PREMIUM_THRESHOLD} pts")
    premium_count = sum(1 for _, r in results if r['is_premium_worthy'])
    print(f"   {premium_count}/{len(test_articles)} articles are premium-worthy")


if __name__ == "__main__":
    test_importance_scorer()
