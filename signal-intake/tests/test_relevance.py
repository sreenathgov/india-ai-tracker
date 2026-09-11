"""Tests for signal_intake.relevance — keyword-based cluster matching."""

import pytest

from signal_intake.models import INTEL_CLUSTERS
from signal_intake.relevance import CLUSTER_KEYWORDS, matched_clusters


class TestClusterKeywords:
    @pytest.mark.unit
    def test_every_intel_cluster_has_keywords(self):
        for cluster in INTEL_CLUSTERS:
            assert cluster in CLUSTER_KEYWORDS
            assert len(CLUSTER_KEYWORDS[cluster]) > 0


class TestMatchedClusters:
    @pytest.mark.unit
    def test_matches_known_keyword(self):
        result = matched_clusters(
            "US announces new tariff on steel imports",
            "",
            candidate_clusters=("trade_policy_tariffs",),
        )
        assert result == ("trade_policy_tariffs",)

    @pytest.mark.unit
    def test_no_keyword_match_returns_empty(self):
        result = matched_clusters(
            "Local bakery wins award for best croissant",
            "",
            candidate_clusters=("trade_policy_tariffs",),
        )
        assert result == ()

    @pytest.mark.unit
    def test_only_considers_summary_too(self):
        result = matched_clusters(
            "Quarterly update",
            "The company announced a new TReDS-based working capital facility.",
            candidate_clusters=("working_capital_trade_finance",),
        )
        assert result == ("working_capital_trade_finance",)

    @pytest.mark.unit
    def test_restricts_to_candidate_clusters(self):
        # Text matches both trade_policy_tariffs and export_control_sanctions
        # keywords, but only trade_policy_tariffs was declared as a
        # candidate for this source — export_control_sanctions must not
        # be returned even though "sanctions" appears in the text.
        result = matched_clusters(
            "New tariff and sanctions package announced",
            "",
            candidate_clusters=("trade_policy_tariffs",),
        )
        assert result == ("trade_policy_tariffs",)

    @pytest.mark.unit
    def test_multiple_candidate_clusters_can_both_match(self):
        result = matched_clusters(
            "New tariff and export control sanctions package announced",
            "",
            candidate_clusters=("trade_policy_tariffs", "export_control_sanctions"),
        )
        assert set(result) == {"trade_policy_tariffs", "export_control_sanctions"}

    @pytest.mark.unit
    def test_case_insensitive(self):
        result = matched_clusters(
            "NEW TARIFF ANNOUNCED",
            "",
            candidate_clusters=("trade_policy_tariffs",),
        )
        assert result == ("trade_policy_tariffs",)

    @pytest.mark.unit
    def test_empty_text_returns_empty(self):
        result = matched_clusters("", "", candidate_clusters=("trade_policy_tariffs",))
        assert result == ()

    @pytest.mark.unit
    def test_rejects_unknown_candidate_cluster(self):
        with pytest.raises(ValueError, match="not_a_real_cluster"):
            matched_clusters("tariff", "", candidate_clusters=("not_a_real_cluster",))

    @pytest.mark.unit
    def test_preserves_candidate_cluster_order(self):
        result = matched_clusters(
            "tariff and trade finance and treds news",
            "",
            candidate_clusters=("working_capital_trade_finance", "trade_policy_tariffs"),
        )
        assert result == ("working_capital_trade_finance", "trade_policy_tariffs")
