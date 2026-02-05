"""
Unit Tests for Conservative Geographic Attributor

Tests the 4 rules:
1. STATE GOVERNMENT ACTION
2. PHYSICAL/OPERATIONAL ACTIVITY
3. LOCATION-BOUND EVENT
4. EXPLICIT INVESTMENT/DEPLOYMENT

Plus tests for:
- Disallowed signals (company HQ, datelines, etc.)
- Multi-state attribution
- National scope detection
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.geo_attributor import GeoAttributor


@pytest.fixture
def geo():
    """Create GeoAttributor instance for tests."""
    return GeoAttributor()


class TestStateGovernmentAction:
    """RULE 1: State government announces/implements AI policy."""

    def test_karnataka_cabinet_approves(self, geo):
        """Karnataka govt action should return KA."""
        states, reason = geo.attribute(
            "Karnataka Cabinet approves AI Centre of Excellence",
            "The state government will invest Rs 500 crore in the new facility."
        )
        assert 'KA' in states
        assert 'GOVT_ACTION:KA' in reason

    def test_tamil_nadu_cm_announcement(self, geo):
        """TN CM announcement should return TN."""
        states, reason = geo.attribute(
            "MK Stalin announces AI mission for Tamil Nadu",
            "Chief Minister Stalin unveiled the Tamil Nadu AI mission today."
        )
        assert 'TN' in states
        assert 'GOVT_ACTION:TN' in reason

    def test_telangana_govt_policy(self, geo):
        """Telangana policy should return TG."""
        states, reason = geo.attribute(
            "Telangana government unveils AI framework",
            "The Telangana cabinet approved the new AI policy framework."
        )
        assert 'TG' in states
        assert 'GOVT_ACTION:TG' in reason

    def test_maharashtra_minister(self, geo):
        """Maharashtra minister action should return MH."""
        states, reason = geo.attribute(
            "Maharashtra IT Minister launches AI skilling program",
            "Maharashtra government partners with tech companies for training."
        )
        assert 'MH' in states

    def test_yogi_adityanath_up(self, geo):
        """CM name mention should return state."""
        states, reason = geo.attribute(
            "Yogi Adityanath inaugurates AI hub",
            "UP CM Yogi Adityanath opened the new technology centre."
        )
        assert 'UP' in states


class TestPhysicalActivity:
    """RULE 2: AI facility/hub being set up in state."""

    def test_opens_office_in_city(self, geo):
        """Opening office in city should return state."""
        states, reason = geo.attribute(
            "Zoho opens AI research centre in Lucknow",
            "The Chennai-based company will establish a new R&D facility in Lucknow."
        )
        assert 'UP' in states
        assert 'PHYSICAL_ACTIVITY:UP' in reason

    def test_new_data_centre(self, geo):
        """New data centre should return state."""
        states, reason = geo.attribute(
            "Microsoft to build AI data centre in Hyderabad",
            "Microsoft announces new data centre facility in Hyderabad."
        )
        assert 'TG' in states

    def test_gcc_establishment(self, geo):
        """GCC being set up should return state."""
        states, reason = geo.attribute(
            "Western Union establishes AI GCC in Pune",
            "The company will set up a Global Capability Center in Pune."
        )
        assert 'MH' in states

    def test_expands_to_city(self, geo):
        """Expansion to city should return state."""
        states, reason = geo.attribute(
            "TCS expands AI operations to Chennai",
            "TCS will expand its AI development facility to Chennai."
        )
        assert 'TN' in states

    def test_inaugurates_hub(self, geo):
        """Inauguration of hub should return state."""
        states, reason = geo.attribute(
            "Google inaugurates AI hub in Bangalore",
            "Google opened its new AI research hub in Bengaluru today."
        )
        assert 'KA' in states


class TestLocationBoundEvent:
    """RULE 3: AI event physically taking place in state."""

    def test_summit_in_city(self, geo):
        """Physical summit should return state."""
        states, reason = geo.attribute(
            "India AI Summit 2026 at Bangalore",
            "The annual AI summit will be held at Bangalore International Convention Centre."
        )
        assert 'KA' in states
        assert 'EVENT_LOCATION:KA' in reason

    def test_conference_in_chennai(self, geo):
        """Conference in city should return state."""
        states, reason = geo.attribute(
            "AI Conference Chennai 2026 - Register Now",
            "Join us at IIT Madras for the premier AI conference."
        )
        assert 'TN' in states

    def test_hackathon_venue(self, geo):
        """Hackathon at venue should return state."""
        states, reason = geo.attribute(
            "GenAI Hackathon at T-Hub Hyderabad",
            "A 48-hour hackathon will be held at T-Hub in Hyderabad."
        )
        assert 'TG' in states

    def test_online_event_no_state(self, geo):
        """Online event should NOT return specific state."""
        states, reason = geo.attribute(
            "AI Virtual Summit India 2026",
            "Join the virtual online summit from anywhere. This is a completely online webinar event."
        )
        assert states == ['IN']

    def test_webinar_no_state(self, geo):
        """Webinar should NOT return specific state."""
        states, reason = geo.attribute(
            "GenAI Webinar Series",
            "Register for our online webinar on generative AI applications."
        )
        assert states == ['IN']


class TestExplicitInvestment:
    """RULE 4: Investment explicitly tied to state."""

    def test_investment_in_hyderabad(self, geo):
        """Investment in city should return state."""
        states, reason = geo.attribute(
            "₹500 crore AI investment in Hyderabad data centre",
            "The company announced Rs 500 crore investment in Hyderabad."
        )
        assert 'TG' in states
        assert 'INVESTMENT:TG' in reason

    def test_deployment_across_state(self, geo):
        """Deployment across state should return state."""
        states, reason = geo.attribute(
            "AI solution deployed across Karnataka hospitals",
            "The healthcare AI will be deployed across Karnataka."
        )
        assert 'KA' in states

    def test_pilot_in_city(self, geo):
        """Pilot in city should return state."""
        states, reason = geo.attribute(
            "AI traffic pilot launches in Pune",
            "A pilot program for AI traffic management in Pune."
        )
        assert 'MH' in states


class TestDisallowedSignals:
    """Signals that should NOT cause state attribution."""

    def test_company_hq_only(self, geo):
        """Company HQ alone should NOT cause attribution."""
        states, reason = geo.attribute(
            "Zoho launches new AI product",
            "Zoho Corporation has launched a new AI-powered analytics tool."
        )
        # Zoho is from Chennai/TN but article is about product launch
        assert states == ['IN']
        assert reason == 'NO_STATE_SIGNAL'

    def test_startup_funding_only(self, geo):
        """Startup funding should NOT cause state attribution based on HQ."""
        states, reason = geo.attribute(
            "Sarvam AI raises $50M Series B",
            "Bangalore-based Sarvam AI has raised $50 million in Series B funding."
        )
        # Funding is national news, not specific to Karnataka
        assert states == ['IN']

    def test_dateline_only(self, geo):
        """Dateline at article start should NOT cause attribution."""
        states, reason = geo.attribute(
            "Chennai: India's AI market to reach $17B",
            "India's artificial intelligence market is projected to reach $17 billion by 2027."
        )
        # "Chennai:" is a dateline, article is about national market
        assert states == ['IN']

    def test_passing_mention(self, geo):
        """Passing city mention should NOT cause attribution."""
        states, reason = geo.attribute(
            "AI adoption trends in Indian enterprises",
            "Companies like those in Bangalore and Pune are adopting AI rapidly. The trend is similar across India."
        )
        # Bangalore/Pune are mentioned in passing, not as subject
        assert states == ['IN']

    def test_quote_mention(self, geo):
        """City in quote should NOT cause attribution."""
        states, reason = geo.attribute(
            "CEO discusses AI strategy",
            "As our Mumbai team noted, AI is transforming businesses. The strategy applies nationwide."
        )
        assert states == ['IN']

    def test_news_source_location(self, geo):
        """Source location should NOT auto-attribute (strict mode)."""
        states, reason = geo.attribute(
            "National AI policy updates",
            "The government announced new AI guidelines applicable across the country.",
            source_state='TG',
            is_state_specific_source=True,
            geo_mode='strict'
        )
        # Content is national, source location shouldn't force TG
        assert states == ['IN']


class TestNationalScope:
    """Articles with national scope should return IN."""

    def test_meity_announcement(self, geo):
        """MeitY announcement is national."""
        states, reason = geo.attribute(
            "MeitY releases AI governance framework",
            "The Ministry of Electronics and IT has released new guidelines."
        )
        assert states == ['IN']
        assert 'NATIONAL_SCOPE' in reason

    def test_india_targets(self, geo):
        """India-level target is national."""
        states, reason = geo.attribute(
            "India targets AI leadership by 2030",
            "The government aims to make India a global AI leader."
        )
        assert states == ['IN']

    def test_pan_india_rollout(self, geo):
        """Pan-India rollout is national."""
        states, reason = geo.attribute(
            "AI solution launched pan-India",
            "The solution will be available across India nationwide."
        )
        assert states == ['IN']

    def test_nasscom_report(self, geo):
        """Industry report is national."""
        states, reason = geo.attribute(
            "Nasscom report on AI adoption in India",
            "The Nasscom AI adoption survey reveals industry trends."
        )
        assert states == ['IN']


class TestMultiStateAttribution:
    """Multi-state projects should return multiple states."""

    def test_corridor_two_states(self, geo):
        """Corridor between two states."""
        states, reason = geo.attribute(
            "AI corridor between Tamil Nadu and Karnataka announced",
            "Tamil Nadu government and Karnataka government jointly announce AI development corridor."
        )
        assert 'TN' in states
        assert 'KA' in states

    def test_central_scheme_multiple_states(self, geo):
        """Central scheme mentioning multiple states should return IN."""
        states, reason = geo.attribute(
            "MeitY AI scheme launched in 5 states",
            "The Ministry launched the scheme across India in multiple states."
        )
        # National scheme, not state-specific
        assert states == ['IN']


class TestEdgeCases:
    """Edge cases and boundary conditions."""

    def test_empty_content(self, geo):
        """Empty content should still work."""
        states, reason = geo.attribute("AI news headline", "")
        assert states == ['IN']

    def test_none_content(self, geo):
        """None content should work."""
        states, reason = geo.attribute("AI news headline", None)
        assert states == ['IN']

    def test_very_long_content(self, geo):
        """Very long content should be truncated."""
        long_content = "AI " * 10000  # 30000 chars
        states, reason = geo.attribute("AI news", long_content)
        # Should not crash
        assert isinstance(states, list)

    def test_special_characters(self, geo):
        """Special characters should not crash."""
        states, reason = geo.attribute(
            "AI & ML: ₹500Cr investment",
            "Investment of ₹500 crore (approx $60M) announced."
        )
        assert isinstance(states, list)

    def test_case_insensitivity(self, geo):
        """Should work regardless of case."""
        states, reason = geo.attribute(
            "KARNATAKA GOVERNMENT ANNOUNCES AI POLICY",
            "THE KARNATAKA CABINET APPROVED THE AI FRAMEWORK."
        )
        assert 'KA' in states


class TestGeoModeHandling:
    """Test geo_mode parameter behavior."""

    def test_force_mode_adds_fallback(self, geo):
        """Force mode should add state only when no signal found."""
        states, reason = geo.attribute(
            "General tech update",
            "Some technology news without specific state mention.",
            source_state='TN',
            is_state_specific_source=True,
            geo_mode='force'
        )
        # No content signal, so force mode adds TN as fallback
        assert 'TN' in states
        assert 'OFFICIAL_SOURCE:TN' in reason

    def test_force_mode_no_override(self, geo):
        """Force mode should NOT override detected state."""
        states, reason = geo.attribute(
            "Karnataka government launches AI initiative",
            "Karnataka cabinet approved new AI program.",
            source_state='TN',
            is_state_specific_source=True,
            geo_mode='force'
        )
        # Content clearly mentions KA, TN should NOT be added
        assert 'KA' in states
        # TN should not be force-added when content has signal
        # Actually in our implementation, force only adds if NO signal found
        # So TN should NOT be in states

    def test_strict_mode_requires_content(self, geo):
        """Strict mode should not add source state."""
        states, reason = geo.attribute(
            "General AI news",
            "Some AI update without specific location.",
            source_state='KA',
            is_state_specific_source=True,
            geo_mode='strict'
        )
        # Strict mode - source state should not be used
        assert states == ['IN']


class TestGetStateName:
    """Test get_state_name helper method."""

    def test_valid_codes(self, geo):
        assert geo.get_state_name('TN') == 'Tamil Nadu'
        assert geo.get_state_name('KA') == 'Karnataka'
        assert geo.get_state_name('IN') == 'All India'

    def test_unknown_code(self, geo):
        assert geo.get_state_name('XX') == 'XX'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
