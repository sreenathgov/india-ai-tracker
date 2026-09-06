"""
Pipeline Regression Tests

Purpose:
- Ensure false positives do not silently reappear
- Test edge cases that have caused issues in the past
- Make future refactors safe

Test Categories:
1. Non-AI articles (robotics-only, hospitals, church meetings)
2. India-incidental global articles
3. Past events
4. Speculative India mentions
5. Weak AI signals without content

Run with: pytest backend/tests/test_pipeline_regression.py -v
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai.ai_subject_validator import AISubjectValidator
from ai.india_subject_validator import IndiaSubjectValidator
from ai.event_temporal_validator import EventTemporalValidator
from ai.geo_attributor import GeoAttributor
from datetime import date


class TestAISubjectValidatorRegression:
    """Regression tests for AI Subject Validator."""

    @pytest.fixture
    def validator(self):
        return AISubjectValidator()

    # =========== MUST PASS (Strong AI signals) ===========

    @pytest.mark.parametrize("title,content", [
        ("GPT-4 achieves breakthrough on benchmark", ""),
        ("ChatGPT users reach 200 million milestone", ""),
        ("New machine learning model released", ""),
        ("Deep learning advances in computer vision", ""),
        ("Neural network architecture improves efficiency", ""),
        ("Large language model training costs drop", ""),
        ("Anthropic releases Claude 4", ""),
        ("Google Gemini update announced", ""),
        ("IIT Madras develops new NLP model", ""),
        ("TCS launches AI platform for enterprises", ""),
    ])
    def test_strong_ai_signals_pass(self, validator, title, content):
        """Strong AI signals in title should pass without content."""
        result = validator.validate(title, content)
        assert result.passed, f"Should pass: {title}. Reason: {result.reason}"

    # =========== MUST DROP (Non-AI articles) ===========

    @pytest.mark.parametrize("title,content", [
        # Robotics without AI
        ("Industrial robot arm installed in factory", "The mechanical arm handles packaging."),
        ("Robotic surgery at hospital", "The robotic system assists surgeons."),

        # Smart/automation without AI
        ("Smart meter rollout in city", "Digital meters will track electricity usage."),
        ("Automation deployed in warehouse", "The conveyor system speeds up logistics."),

        # Completely non-tech
        ("Church meeting scheduled for Sunday", "Community gathering at the local church."),
        ("Hospital inaugurates new wing", "The medical facility expands capacity."),
        ("Cricket match highlights", "India vs Australia test series continues."),
        ("Weather forecast for tomorrow", "Expect sunny skies across the region."),
    ])
    def test_non_ai_articles_drop(self, validator, title, content):
        """Non-AI articles should be dropped."""
        result = validator.validate(title, content)
        assert not result.passed, f"Should drop: {title}. Reason: {result.reason}"

    # =========== WEAK SIGNALS (need content reinforcement) ===========

    @pytest.mark.parametrize("title,content,expected_pass", [
        # Weak title + no content = DROP
        ("Robotic automation in manufacturing", "", False),
        ("AI-powered marketing tool launched", "", False),
        ("Smart city initiative announced", "", False),
        ("Autonomous vehicle testing begins", "", False),

        # Weak title + strong content = PASS
        ("AI-powered tool launched", "Uses deep learning and neural networks for inference.", True),
        ("Robotics system unveiled", "Transformer models trained on GPU clusters.", True),
    ])
    def test_weak_signals_need_content(self, validator, title, content, expected_pass):
        """Weak AI signals require content reinforcement."""
        result = validator.validate(title, content)
        assert result.passed == expected_pass, f"Title: {title}, Expected: {expected_pass}, Got: {result.passed}, Reason: {result.reason}"

    @pytest.mark.parametrize('decision', [True, False])
    def test_borderline_content_follows_review(self, validator, monkeypatch, decision):
        calls = []
        def review(title, content, has_title_signal):
            calls.append(has_title_signal)
            return {'is_subject': decision, 'classification': 'TEST_REVIEW'}
        monkeypatch.setattr(validator, '_llm_verify', review)
        result = validator.validate('Smart solution deployed',
                                    'Machine learning algorithms process data in real-time.')
        assert calls == [False]
        assert result.passed is decision
        assert result.llm_used is True

    def test_borderline_content_without_api_key_fails_closed(self, validator):
        result = validator.validate('Smart solution deployed',
                                    'Machine learning algorithms process data in real-time.')
        assert result.passed is False
        assert result.reason == 'LLM_VERIFIED:NO_API_KEY_DROP'


class TestIndiaSubjectValidatorRegression:
    """Regression tests for India Subject Validator."""

    @pytest.fixture
    def validator(self):
        return IndiaSubjectValidator()

    # =========== MUST PASS (Direct India involvement) ===========

    @pytest.mark.parametrize("title,content", [
        # Indian companies
        ("TCS launches AI platform", "Tata Consultancy Services announced..."),
        ("Infosys expands AI capabilities", ""),
        ("Wipro partners with tech giant", ""),
        ("Sarvam AI raises funding", ""),

        # Indian cities
        ("AI startup launches in Bangalore", ""),
        ("Hyderabad hosts tech summit", ""),
        ("Chennai company develops NLP tool", ""),
        ("Mumbai Police deploys AI system", ""),

        # Indian government/institutions
        ("MeitY releases AI guidelines", ""),
        ("IIT Madras develops new model", ""),
        ("Karnataka govt announces policy", ""),
        ("NITI Aayog AI report released", ""),
    ])
    def test_direct_india_signals_pass(self, validator, title, content):
        """Direct India signals should pass."""
        result = validator.validate(title, content)
        assert result.passed, f"Should pass: {title}. Reason: {result.reason}"

    # =========== MUST DROP (Global articles with incidental India mention) ===========

    @pytest.mark.parametrize("title,content", [
        # Speculative/comparative
        ("OpenAI expanding to countries like India", ""),
        ("AI adoption in emerging markets including India", ""),
        ("Compared to India, China leads in AI", ""),
        ("Company plans to enter India next year", ""),

        # Global news no India
        ("ChatGPT down globally", "Users report widespread issues."),
        ("OpenAI CEO discusses AGI", "Sam Altman spoke at conference."),
        ("NVIDIA earnings beat estimates", "Strong quarterly results."),
        ("US Senate debates AI regulation", "New legislation proposed."),
        ("EU passes AI Act", "Comprehensive regulation framework."),
    ])
    def test_global_articles_drop(self, validator, title, content):
        """Global articles with incidental India mention should drop."""
        result = validator.validate(title, content)
        assert not result.passed, f"Should drop: {title}. Reason: {result.reason}"


class TestEventTemporalValidatorRegression:
    """Regression tests for Event Temporal Validator."""

    @pytest.fixture
    def validator(self):
        return EventTemporalValidator()

    @pytest.fixture
    def today(self):
        return date.today()

    # =========== MUST PASS (Future events) ===========

    @pytest.mark.parametrize("title,content", [
        ("AI Summit 2027 - Register Now", "Join us for the upcoming conference."),
        ("Upcoming hackathon in Bangalore", "Registration opens next week."),
        ("Tech conference to be held in March", "Save the date for this event."),
        ("Early bird tickets available", "Don't miss this AI workshop."),
    ])
    def test_future_events_pass(self, validator, today, title, content):
        """Future events should pass (is_future=True)."""
        result = validator.validate(title, content, today)
        assert result.is_future, f"Should be future: {title}. Reason: {result.reason}"

    # =========== MUST DROP (Past events) ===========

    @pytest.mark.parametrize("title,content", [
        ("AI Summit 2024 Highlights", "The conference concluded last week."),
        ("Conference recap and key takeaways", "Attendees gathered to discuss AI."),
        ("Event concluded successfully", "Participants shared insights."),
        ("Hackathon winners announced", "Top teams received prizes."),
        ("Summit 2023 highlights released", "Videos now available online."),
    ])
    def test_past_events_drop(self, validator, today, title, content):
        """Past events should drop (is_future=False)."""
        result = validator.validate(title, content, today)
        assert not result.is_future, f"Should be past: {title}. Reason: {result.reason}"


class TestGeoAttributorRegression:
    """Regression tests for Geographic Attributor."""

    @pytest.fixture
    def attributor(self):
        return GeoAttributor()

    # =========== Institution matches ===========

    @pytest.mark.parametrize("title,expected_state", [
        ("IIT Madras develops new AI chip", "TN"),
        ("IIT Bombay researchers publish paper", "MH"),
        ("IIT Delhi hosts hackathon", "DL"),
        ("IIT Kanpur wins award", "UP"),
        ("Mumbai Police deploys facial recognition", "MH"),
        ("Delhi Metro introduces AI ticketing", "DL"),
        ("AIIMS Delhi gets new AI system", "DL"),
        ("Chennai Metro launches smart cards", "TN"),
    ])
    def test_institution_attribution(self, attributor, title, expected_state):
        """Institutions should be correctly attributed to states."""
        states, reason = attributor.attribute(title)
        assert expected_state in states, f"Title: {title}, Expected: {expected_state}, Got: {states}, Reason: {reason}"
        assert "INSTITUTION_MATCH" in reason

    # =========== City matches ===========

    @pytest.mark.parametrize("title,expected_state", [
        ("AI startup launches in Lucknow", "UP"),
        ("New data center opens in Pune", "MH"),
        ("Bengaluru leads in AI innovation", "KA"),
        ("Chennai hosts AI summit", "TN"),
        ("Hyderabad company raises funding", "TG"),
        ("Kolkata startup develops NLP tool", "WB"),
    ])
    def test_city_attribution(self, attributor, title, expected_state):
        """Cities should be correctly attributed to states."""
        states, reason = attributor.attribute(title)
        assert expected_state in states, f"Title: {title}, Expected: {expected_state}, Got: {states}, Reason: {reason}"

    # =========== National scope ===========

    @pytest.mark.parametrize("title", [
        "MeitY announces new AI guidelines",
        "India launches pan-India AI initiative",
        "Government of India AI strategy",
        "NITI Aayog releases AI report",
        "Parliament debates AI regulation",
    ])
    def test_national_scope(self, attributor, title):
        """National articles should get 'IN' attribution."""
        states, reason = attributor.attribute(title)
        assert "IN" in states, f"Title: {title}, Expected: IN, Got: {states}, Reason: {reason}"
        assert "NATIONAL" in reason or "NO_STATE" in reason

    # =========== Company HQ should NOT override location ===========

    def test_company_hq_no_override(self, attributor):
        """Company HQ should not override actual location."""
        # Infosys HQ is Bangalore but news about global AI
        states, reason = attributor.attribute("Infosys launches global AI platform")
        assert "IN" in states or "KA" not in states or len(states) == 1
        # Note: "Infosys" without location mention should NOT auto-assign KA

        # TCS opens center in Chennai (should be TN, not MH)
        states, reason = attributor.attribute("TCS opens AI center in Chennai")
        assert "TN" in states, f"Expected TN (Chennai), got {states}"


class TestPipelineDropReasonLogging:
    """Test that drop reasons are properly logged."""

    def test_ai_validator_logs_reason(self):
        """AI validator should provide clear drop reason."""
        validator = AISubjectValidator()
        result = validator.validate("Robotic arm installed", "")
        assert result.reason is not None
        assert len(result.reason) > 0

    def test_india_validator_logs_reason(self):
        """India validator should provide clear drop reason."""
        validator = IndiaSubjectValidator()
        result = validator.validate("OpenAI releases new model", "")
        assert result.reason is not None
        assert len(result.reason) > 0

    def test_event_validator_logs_reason(self):
        """Event validator should provide clear temporal reason."""
        validator = EventTemporalValidator()
        result = validator.validate("Conference 2024 highlights", "", date.today())
        assert result.reason is not None
        assert len(result.reason) > 0


class TestEnvironmentVariables:
    """Test environment variable toggles."""

    def test_llm_adjudicator_toggle(self):
        """LLM adjudicator should respect environment variable."""
        from ai.llm_adjudicator import LLMAdjudicator

        # Test disabled
        os.environ['LLM_ADJUDICATOR_ENABLED'] = 'false'
        adj = LLMAdjudicator()
        assert not adj.enabled

        # Test enabled (default)
        os.environ['LLM_ADJUDICATOR_ENABLED'] = 'true'
        adj = LLMAdjudicator()
        assert adj.enabled

        # Cleanup
        del os.environ['LLM_ADJUDICATOR_ENABLED']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
