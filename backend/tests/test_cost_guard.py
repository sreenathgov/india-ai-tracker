"""
Unit tests for backend.ai.cost_guard — the Layer-2 LLM cost circuit breaker.

Layer 3 (Gemini) is already capped to top-N, but Layer 2 (Groq) processes every
article that passes the free Layer-1 filter, with no ceiling. A runaway scrape
(infinite pagination, redirect loop, mis-configured source) could therefore
issue unbounded paid API calls. enforce_layer2_cap bounds that blast radius.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.cost_guard import enforce_layer2_cap


@pytest.mark.unit
class TestEnforceLayer2Cap:
    def test_no_cap_when_under_limit(self):
        articles = [{"id": i} for i in range(10)]
        capped, dropped = enforce_layer2_cap(articles, 500)
        assert dropped == 0
        assert len(capped) == 10

    def test_truncates_when_over_limit(self):
        articles = [{"id": i} for i in range(1200)]
        capped, dropped = enforce_layer2_cap(articles, 500)
        assert len(capped) == 500
        assert dropped == 700

    def test_keeps_highest_priority_first_n(self):
        # Articles are pre-sorted by priority; the cap must keep the leading N.
        articles = [{"id": i} for i in range(100)]
        capped, _ = enforce_layer2_cap(articles, 10)
        assert [a["id"] for a in capped] == list(range(10))

    def test_exactly_at_limit_is_not_capped(self):
        articles = [{"id": i} for i in range(500)]
        capped, dropped = enforce_layer2_cap(articles, 500)
        assert dropped == 0
        assert len(capped) == 500

    def test_zero_or_none_limit_disables_cap(self):
        articles = [{"id": i} for i in range(50)]
        assert enforce_layer2_cap(articles, 0)[1] == 0
        assert enforce_layer2_cap(articles, None)[1] == 0
        assert len(enforce_layer2_cap(articles, None)[0]) == 50

    def test_does_not_mutate_input_list(self):
        articles = [{"id": i} for i in range(20)]
        enforce_layer2_cap(articles, 5)
        assert len(articles) == 20  # original untouched

    def test_empty_input(self):
        capped, dropped = enforce_layer2_cap([], 500)
        assert capped == []
        assert dropped == 0
