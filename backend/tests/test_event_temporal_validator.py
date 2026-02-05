"""
Unit Tests for Event Temporal Validator

Tests the validation logic:
1. Explicit year extraction → Compare to reference year
2. Past indicators → DROP
3. Future indicators → PASS
4. No signals → DROP (conservative)

Reference year: 2026
"""

import pytest
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.event_temporal_validator import EventTemporalValidator, TemporalValidationResult


@pytest.fixture
def validator():
    """Create EventTemporalValidator instance with 2026 as reference year."""
    return EventTemporalValidator(reference_year=2026)


class TestYearExtraction:
    """Test year extraction and comparison."""

    def test_future_year_2026(self, validator):
        """2026 events should pass."""
        result = validator.validate("India AI Summit 2026")
        assert result.is_future is True
        assert result.extracted_year == 2026
        assert 'FUTURE_YEAR' in result.reason

    def test_future_year_2027(self, validator):
        """2027 events should pass."""
        result = validator.validate("AI Conference 2027")
        assert result.is_future is True
        assert result.extracted_year == 2027

    def test_past_year_2024(self, validator):
        """2024 events should be dropped."""
        result = validator.validate("Bengaluru Tech Summit 2024")
        assert result.is_future is False
        assert result.extracted_year == 2024
        assert 'PAST_YEAR' in result.reason

    def test_past_year_2025(self, validator):
        """2025 events should be dropped."""
        result = validator.validate("AI Workshop 2025")
        assert result.is_future is False
        assert result.extracted_year == 2025

    def test_past_year_2023(self, validator):
        """2023 events should be dropped."""
        result = validator.validate("Tech Conference 2023")
        assert result.is_future is False
        assert result.extracted_year == 2023


class TestPastIndicators:
    """Test past event detection."""

    def test_was_held(self, validator):
        """'was held' indicates past event."""
        result = validator.validate("The AI Summit was held last week")
        assert result.is_future is False
        assert 'PAST_INDICATOR' in result.reason

    def test_concluded(self, validator):
        """'concluded' indicates past event."""
        result = validator.validate("AI Conference concluded successfully")
        assert result.is_future is False
        assert 'PAST_INDICATOR' in result.reason

    def test_took_place(self, validator):
        """'took place' indicates past event."""
        result = validator.validate("The workshop took place in Mumbai")
        assert result.is_future is False

    def test_highlights_from(self, validator):
        """'highlights from' indicates recap."""
        result = validator.validate("Key highlights from AI Summit 2025")
        assert result.is_future is False

    def test_winners_announced(self, validator):
        """'winners announced' indicates past event."""
        result = validator.validate("Winners announced at AI Awards")
        assert result.is_future is False

    def test_day_coverage(self, validator):
        """'Day 2 of' indicates ongoing/past event."""
        result = validator.validate("Day 2 of the AI Summit saw record attendance")
        assert result.is_future is False

    def test_attended_by(self, validator):
        """'attended by' indicates past event."""
        result = validator.validate("The event was attended by 500 participants")
        assert result.is_future is False

    def test_recap_with_future_year(self, validator):
        """Recap of future year event should be dropped."""
        result = validator.validate("AI Summit 2026 - Recap and Highlights")
        assert result.is_future is False
        assert 'PAST_RECAP' in result.reason


class TestFutureIndicators:
    """Test future event detection."""

    def test_registration_open(self, validator):
        """'registration open' indicates future event."""
        result = validator.validate("AI Conference - Registration Open")
        assert result.is_future is True
        assert 'FUTURE_INDICATOR' in result.reason

    def test_register_now(self, validator):
        """'register now' indicates future event."""
        result = validator.validate("AI Workshop - Register Now")
        assert result.is_future is True

    def test_early_bird(self, validator):
        """'early bird' indicates future event."""
        result = validator.validate("Early Bird Tickets for AI Summit")
        assert result.is_future is True

    def test_will_be_held(self, validator):
        """'will be held' indicates future event."""
        result = validator.validate("The conference will be held in March")
        assert result.is_future is True

    def test_upcoming(self, validator):
        """'upcoming' indicates future event."""
        result = validator.validate("Upcoming AI Hackathon in Bangalore")
        assert result.is_future is True

    def test_join_us(self, validator):
        """'join us' indicates future event."""
        result = validator.validate("Join us at the AI Workshop")
        assert result.is_future is True

    def test_save_the_date(self, validator):
        """'save the date' indicates future event."""
        result = validator.validate("Save the Date: AI Summit 2026")
        assert result.is_future is True

    def test_call_for_papers(self, validator):
        """'call for papers' indicates future event."""
        result = validator.validate("Call for Papers - AI Conference")
        assert result.is_future is True

    def test_deadline(self, validator):
        """'deadline' for registration indicates future event."""
        result = validator.validate("Registration deadline approaching for AI Summit")
        assert result.is_future is True


class TestNoSignal:
    """Articles without clear temporal signals should be dropped."""

    def test_no_date_signal(self, validator):
        """Event without date signal should be dropped (conservative)."""
        result = validator.validate("Tech Conference in Mumbai")
        assert result.is_future is False
        assert result.reason == 'NO_DATE_SIGNAL'

    def test_generic_event_mention(self, validator):
        """Generic event mention should be dropped."""
        result = validator.validate("AI Workshop")
        assert result.is_future is False


class TestEdgeCases:
    """Edge cases and boundary conditions."""

    def test_empty_title(self, validator):
        """Empty title should work."""
        result = validator.validate("", "")
        assert result.is_future is False
        assert result.reason == 'NO_DATE_SIGNAL'

    def test_none_content(self, validator):
        """None content should work."""
        result = validator.validate("AI Summit 2026", None)
        assert result.is_future is True

    def test_multiple_years(self, validator):
        """Should extract first relevant year."""
        result = validator.validate("AI Summit 2024 vs 2026 comparison")
        # Should get first year found
        assert result.extracted_year is not None

    def test_year_in_content(self, validator):
        """Year in content should be detected."""
        result = validator.validate(
            "AI Conference Registration",
            "Join us in 2026 for the biggest AI event."
        )
        assert result.is_future is True
        assert result.extracted_year == 2026


class TestValidationResult:
    """Test TemporalValidationResult dataclass."""

    def test_result_attributes(self, validator):
        """Result should have all expected attributes."""
        result = validator.validate("AI Summit 2026")
        assert hasattr(result, 'is_future')
        assert hasattr(result, 'reason')
        assert hasattr(result, 'extracted_year')
        assert hasattr(result, 'matched_patterns')

    def test_matched_patterns_list(self, validator):
        """matched_patterns should be a list."""
        result = validator.validate("AI Summit 2026")
        assert isinstance(result.matched_patterns, list)


class TestRealWorldExamples:
    """Test with real-world-like examples."""

    def test_bengaluru_tech_summit_2024(self, validator):
        """Past Bengaluru Tech Summit should be dropped."""
        result = validator.validate(
            "Bengaluru Tech Summit 2024",
            "The annual technology conference brought together industry leaders..."
        )
        assert result.is_future is False

    def test_india_ai_summit_2026(self, validator):
        """Future India AI Summit should pass."""
        result = validator.validate(
            "India AI Summit 2026 - Register Now",
            "Registration is now open for India's premier AI conference..."
        )
        assert result.is_future is True

    def test_ai_conclave_highlights(self, validator):
        """Event highlights should be dropped."""
        result = validator.validate(
            "AI Conclave - Key Takeaways",
            "Here are the highlights from this year's AI Conclave..."
        )
        assert result.is_future is False

    def test_upcoming_hackathon(self, validator):
        """Upcoming hackathon should pass."""
        result = validator.validate(
            "Upcoming: GenAI Hackathon - Call for Participants",
            "Join us for the upcoming hackathon focusing on generative AI..."
        )
        assert result.is_future is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
