"""
LLM Adjudicator Integration Test

Tests the LLM adjudicator in isolation with mock data.
Run with: python3 backend/tests/test_llm_adjudicator_integration.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai.llm_adjudicator import LLMAdjudicator, AdjudicatorResult


def test_adjudicator_disabled():
    """Test that disabled adjudicator passes through results."""
    os.environ['LLM_ADJUDICATOR_ENABLED'] = 'false'

    adj = LLMAdjudicator()
    assert not adj.enabled, "Adjudicator should be disabled"

    article = {
        'title': 'Test article',
        'content': 'Test content',
        'category': 'Major AI Developments',
        'state_codes': ['KA']
    }

    result = adj.adjudicate(article)

    assert not result.should_drop, "Should not drop when disabled"
    assert result.category == 'Major AI Developments', "Should preserve category"
    assert result.state_codes == ['KA'], "Should preserve states"
    assert 'LLM_DISABLED' in result.llm_reasoning

    del os.environ['LLM_ADJUDICATOR_ENABLED']
    print("✓ test_adjudicator_disabled passed")


def test_adjudicator_passthrough_on_error():
    """Test that adjudicator passes through on initialization error."""
    # Temporarily unset API key
    original_key = os.environ.get('GEMINI_API_KEY')
    if 'GEMINI_API_KEY' in os.environ:
        del os.environ['GEMINI_API_KEY']

    adj = LLMAdjudicator(api_key='')
    article = {
        'title': 'Test article',
        'content': 'Test content',
        'category': 'AI Start-Up News',
        'state_codes': ['TN']
    }

    result = adj.adjudicate(article)

    assert not result.should_drop, "Should not drop on error"
    assert result.category == 'AI Start-Up News', "Should preserve category"
    assert result.state_codes == ['TN'], "Should preserve states"
    assert result.original_preserved, "Should mark as original preserved"

    # Restore key
    if original_key:
        os.environ['GEMINI_API_KEY'] = original_key

    print("✓ test_adjudicator_passthrough_on_error passed")


def test_batch_adjudication():
    """Test batch adjudication."""
    os.environ['LLM_ADJUDICATOR_ENABLED'] = 'false'

    adj = LLMAdjudicator()
    articles = [
        {'title': 'Article 1', 'content': '', 'category': 'Events', 'state_codes': ['DL']},
        {'title': 'Article 2', 'content': '', 'category': 'Major AI Developments', 'state_codes': ['IN']},
    ]

    results = adj.adjudicate_batch(articles)

    assert len(results) == 2, "Should return 2 results"
    assert all(not r.should_drop for r in results), "None should be dropped when disabled"

    del os.environ['LLM_ADJUDICATOR_ENABLED']
    print("✓ test_batch_adjudication passed")


def test_valid_categories():
    """Test that adjudicator validates categories."""
    from ai.llm_adjudicator import VALID_CATEGORIES

    expected = [
        'Policies and Initiatives',
        'AI Start-Up News',
        'Major AI Developments',
        'Events'
    ]

    assert VALID_CATEGORIES == expected, f"Categories mismatch: {VALID_CATEGORIES}"
    print("✓ test_valid_categories passed")


def test_valid_state_codes():
    """Test that adjudicator has valid state codes."""
    from ai.llm_adjudicator import VALID_STATE_CODES

    # Check key states
    assert 'IN' in VALID_STATE_CODES
    assert 'TN' in VALID_STATE_CODES
    assert 'KA' in VALID_STATE_CODES
    assert 'MH' in VALID_STATE_CODES
    assert 'DL' in VALID_STATE_CODES

    print("✓ test_valid_state_codes passed")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("LLM ADJUDICATOR INTEGRATION TESTS")
    print("=" * 60 + "\n")

    test_adjudicator_disabled()
    test_adjudicator_passthrough_on_error()
    test_batch_adjudication()
    test_valid_categories()
    test_valid_state_codes()

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED")
    print("=" * 60 + "\n")
