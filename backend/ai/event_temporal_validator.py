"""
Event Temporal Validator

Validates that events are in the FUTURE, not the past.
Applied ONLY to articles categorised as "Events".

Decision Flow:
1. Extract explicit year from text → Compare to current year
2. Check for strong past indicators → DROP
3. Check for future indicators → PASS
4. No clear signal → DROP (conservative for events)

Current year: 2026 (hardcoded reference, also uses datetime)
"""

import re
from datetime import datetime, date
from typing import Tuple, Optional, List
from dataclasses import dataclass, field


@dataclass
class TemporalValidationResult:
    """Result of event temporal validation."""
    is_future: bool
    reason: str
    extracted_year: Optional[int] = None
    matched_patterns: List[str] = field(default_factory=list)


class EventTemporalValidator:
    """
    Validates that events are in the future, not the past.

    Core principle: Events section should only show UPCOMING events.
    Past events should be reclassified to "Major AI Developments".
    """

    # =========================================================================
    # YEAR EXTRACTION PATTERNS
    # =========================================================================

    # Explicit year patterns in text
    YEAR_PATTERNS = [
        r'\b(20\d{2})\b',  # 2020-2099
    ]

    # =========================================================================
    # PAST EVENT INDICATORS (Strong signals event already happened)
    # =========================================================================

    PAST_INDICATORS = [
        # Completed verbs
        r'\b(?:was|were)\s+held\b',
        r'\btook\s+place\b',
        r'\bconclud(?:ed|es)\b',
        r'\bwrapped\s+up\b',
        r'\bended\b',
        r'\b(?:was|were)\s+(?:hosted|organized|organised)\b',
        r'\bsuccessfully\s+(?:held|hosted|organized|concluded)\b',

        # Past participation
        r'\battended\s+(?:by|the)\b',
        r'\bparticipants?\s+attended\b',
        r'\bsaw\s+participation\b',
        r'\bsaw\s+(?:over|more\s+than)\s+\d+\s+(?:participants?|attendees?)\b',

        # Results/recap
        r'\b(?:winners?|awardees?)\s+(?:of|at|from|announced)\b',
        r'\bhighlights?\s+(?:from|of)\b',
        r'\bkey\s+takeaways?\s+from\b',
        r'\brecap\b',
        r'\bin\s+(?:photos?|pictures?|images?)\b',

        # Day-by-day coverage
        r'\bday\s+\d+\s+(?:of|at)\b',
        r'\bkicked\s+off\b',

        # Past tense event references
        r'\b(?:last|this)\s+(?:week|month|year)\'?s?\s+(?:conference|summit|event|workshop)\b',
        r'\bthe\s+(?:conference|summit|event)\s+(?:was|saw|had|featured)\b',
        r'\bannouncements?\s+(?:made\s+)?at\b',
        r'\bannounced\s+at\s+the\b',
    ]

    # =========================================================================
    # FUTURE EVENT INDICATORS (Strong signals event is upcoming)
    # =========================================================================

    FUTURE_INDICATORS = [
        # Registration/booking
        r'\bregistration\s+(?:is\s+)?open\b',
        r'\bregister\s+(?:now|here|today)\b',
        r'\bearly\s+bird\b',
        r'\bearly\s+registration\b',
        r'\bbook\s+(?:your\s+)?(?:tickets?|seats?|spot)\b',
        r'\bget\s+your\s+tickets?\b',
        r'\blimited\s+seats?\b',

        # Future tense
        r'\bwill\s+be\s+held\b',
        r'\bto\s+be\s+held\b',
        r'\bwill\s+(?:take\s+place|host|organize|feature)\b',
        r'\b(?:is|are)\s+(?:hosting|organizing|organising)\b',
        r'\bscheduled\s+(?:for|on|to)\b',

        # Invitations
        r'\bjoin\s+us\b',
        r'\binvites?\s+(?:you|applications|participants)\b',
        r'\bcall\s+for\s+(?:papers|proposals|speakers|participants)\b',

        # Upcoming indicators
        r'\bupcoming\b',
        r'\bsave\s+the\s+date\b',
        r'\bmark\s+your\s+calendar\b',

        # Deadlines (implies future)
        r'\bdeadline\b.*\b(?:registration|submission|application)\b',
        r'\b(?:registration|submission)\s+deadline\b',
        r'\blast\s+date\s+to\s+register\b',
    ]

    def __init__(self, reference_year: int = None):
        """
        Initialize validator.

        Args:
            reference_year: Current year for comparison (defaults to actual current year)
        """
        self.reference_year = reference_year or datetime.now().year
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile all regex patterns for performance."""
        self.year_patterns = [re.compile(p, re.I) for p in self.YEAR_PATTERNS]
        self.past_patterns = [re.compile(p, re.I) for p in self.PAST_INDICATORS]
        self.future_patterns = [re.compile(p, re.I) for p in self.FUTURE_INDICATORS]

    def validate(self, title: str, content: str = "", reference_date: date = None) -> TemporalValidationResult:
        """
        Validate that an event is in the future.

        Args:
            title: Article title
            content: Article content
            reference_date: Date to compare against (defaults to today)

        Returns:
            TemporalValidationResult with decision and audit trail
        """
        title = title or ""
        content = content or ""
        text = f"{title} {content[:2000]}"
        matched_patterns = []

        if reference_date is None:
            reference_date = datetime.now().date()

        reference_year = reference_date.year

        # STEP 1: Extract year from text
        extracted_year = self._extract_year(text)

        if extracted_year:
            matched_patterns.append(f"YEAR:{extracted_year}")

            # If year is in the past → DEFINITE DROP
            if extracted_year < reference_year:
                return TemporalValidationResult(
                    is_future=False,
                    reason=f'PAST_YEAR:{extracted_year}',
                    extracted_year=extracted_year,
                    matched_patterns=matched_patterns
                )

            # If year is current or future → Check for past indicators
            if extracted_year >= reference_year:
                # Even with future year, check if it's a recap
                if self._has_strong_past_indicator(text):
                    past_match = self._get_past_indicator_match(text)
                    matched_patterns.append(f"PAST_INDICATOR:{past_match}")
                    return TemporalValidationResult(
                        is_future=False,
                        reason=f'PAST_RECAP:{extracted_year}',
                        extracted_year=extracted_year,
                        matched_patterns=matched_patterns
                    )

                # Future/current year + no past indicators → PASS
                return TemporalValidationResult(
                    is_future=True,
                    reason=f'FUTURE_YEAR:{extracted_year}',
                    extracted_year=extracted_year,
                    matched_patterns=matched_patterns
                )

        # STEP 2: No explicit year - check for past indicators
        if self._has_strong_past_indicator(text):
            past_match = self._get_past_indicator_match(text)
            matched_patterns.append(f"PAST_INDICATOR:{past_match}")
            return TemporalValidationResult(
                is_future=False,
                reason='PAST_INDICATOR',
                extracted_year=None,
                matched_patterns=matched_patterns
            )

        # STEP 3: Check for future indicators
        if self._has_future_indicator(text):
            future_match = self._get_future_indicator_match(text)
            matched_patterns.append(f"FUTURE_INDICATOR:{future_match}")
            return TemporalValidationResult(
                is_future=True,
                reason='FUTURE_INDICATOR',
                extracted_year=None,
                matched_patterns=matched_patterns
            )

        # STEP 4: No clear signal → DROP (conservative for events)
        return TemporalValidationResult(
            is_future=False,
            reason='NO_DATE_SIGNAL',
            extracted_year=None,
            matched_patterns=[]
        )

    def _extract_year(self, text: str) -> Optional[int]:
        """
        Extract the most relevant year from text.

        Returns the first year found that's 2020 or later.
        """
        for pattern in self.year_patterns:
            matches = pattern.findall(text)
            for match in matches:
                year = int(match)
                # Only consider years from 2020 onwards
                if 2020 <= year <= 2030:
                    return year
        return None

    def _has_strong_past_indicator(self, text: str) -> bool:
        """Check if text has strong past event indicators."""
        count = sum(1 for p in self.past_patterns if p.search(text))
        # Require at least 1 strong past indicator
        return count >= 1

    def _get_past_indicator_match(self, text: str) -> str:
        """Get the first matching past indicator."""
        for pattern in self.past_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0)[:30]
        return "unknown"

    def _has_future_indicator(self, text: str) -> bool:
        """Check if text has future event indicators."""
        return any(p.search(text) for p in self.future_patterns)

    def _get_future_indicator_match(self, text: str) -> str:
        """Get the first matching future indicator."""
        for pattern in self.future_patterns:
            match = pattern.search(text)
            if match:
                return match.group(0)[:30]
        return "unknown"


def test_validator():
    """Test the Event Temporal Validator with sample events."""
    # Use 2026 as reference year
    validator = EventTemporalValidator(reference_year=2026)

    test_cases = [
        # FUTURE - Should PASS
        ("India AI Summit 2026 - Registration Open", "", True),
        ("AI Conference 2027 - Early Bird Tickets Available", "", True),
        ("Bengaluru Tech Summit 2026 will be held in March", "", True),
        ("Join us at the AI Workshop - Register Now", "", True),
        ("Upcoming: GenAI Hackathon - Call for Participants", "", True),

        # PAST - Should DROP
        ("Bengaluru Tech Summit 2024 - Highlights", "", False),
        ("AI Conference 2025 concluded successfully", "", False),
        ("Tech Summit 2024 - Key Takeaways", "", False),
        ("The conference was held last month", "", False),
        ("Day 2 of the AI Summit saw record attendance", "", False),
        ("Winners announced at AI Awards 2025", "", False),

        # EDGE CASES
        ("AI Workshop 2026 - Recap and Highlights", "", False),  # Future year but recap
        ("Tech Conference", "", False),  # No date signal - conservative DROP
    ]

    print("\n" + "=" * 70)
    print("EVENT TEMPORAL VALIDATOR TEST (Reference: 2026)")
    print("=" * 70 + "\n")

    passed_tests = 0
    failed_tests = 0

    for title, content, expected_future in test_cases:
        result = validator.validate(title, content)
        test_passed = result.is_future == expected_future

        if test_passed:
            passed_tests += 1
            status = "PASS"
        else:
            failed_tests += 1
            status = "FAIL"

        print(f"{'OK' if test_passed else 'XX'} {status}: {title[:50]}...")
        print(f"    Expected: {'FUTURE' if expected_future else 'PAST'}, Got: {'FUTURE' if result.is_future else 'PAST'}")
        print(f"    Reason: {result.reason}")
        if result.extracted_year:
            print(f"    Year: {result.extracted_year}")
        print()

    print("=" * 70)
    print(f"Results: {passed_tests} passed, {failed_tests} failed")
    print("=" * 70)


if __name__ == "__main__":
    test_validator()
