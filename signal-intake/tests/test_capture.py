"""Tests for signal_intake.capture — builds SignalRecord from a normalized
feed entry plus source metadata."""

import json

import pytest

from signal_intake.capture import build_signal_record, compute_content_hash
from signal_intake.source_registry import Source

SOURCE = Source(
    name="Example Regulator",
    url="https://example.gov/rss.xml",
    tier=1,
    clusters=("trade_policy_tariffs", "export_control_sanctions"),
    notes="test source",
)

FULL_ENTRY = {
    "title": "US announces new tariff on steel",
    "url": "https://example.gov/news/steel-tariff",
    "summary": "The US announced a new tariff on steel imports today.",
    "published_at": "2026-09-10T12:00:00+00:00",
}

RETRIEVED_AT = "2026-09-11T00:00:00+00:00"


class TestComputeContentHash:
    @pytest.mark.unit
    def test_is_64_hex_chars(self):
        digest = compute_content_hash("https://x.com/a", "Title", "Summary")
        assert len(digest) == 64
        assert all(c in "0123456789abcdef" for c in digest)

    @pytest.mark.unit
    def test_deterministic(self):
        a = compute_content_hash("https://x.com/a", "Title", "Summary")
        b = compute_content_hash("https://x.com/a", "Title", "Summary")
        assert a == b

    @pytest.mark.unit
    def test_normalizes_case_and_whitespace(self):
        a = compute_content_hash("https://x.com/a", "Title Here", "Summary text")
        b = compute_content_hash("https://x.com/a", "  title   here  ", "SUMMARY TEXT")
        assert a == b

    @pytest.mark.unit
    def test_different_content_different_hash(self):
        a = compute_content_hash("https://x.com/a", "Title A", "Summary")
        b = compute_content_hash("https://x.com/b", "Title B", "Summary")
        assert a != b


class TestBuildSignalRecord:
    @pytest.mark.unit
    def test_populates_first_three_blocks(self, tmp_path):
        record = build_signal_record(
            FULL_ENTRY, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        assert record.signal_meta.intel_cluster == "trade_policy_tariffs"
        assert record.capture.url == FULL_ENTRY["url"]
        assert record.capture.publisher == SOURCE.name
        assert record.authority.source_tier == SOURCE.tier
        assert record.authority.corroboration_state == "UNCORROBORATED"

    @pytest.mark.unit
    def test_leaves_future_blocks_none(self, tmp_path):
        record = build_signal_record(
            FULL_ENTRY, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        assert record.assessment is None
        assert record.graph_links is None
        assert record.weaver_handoff is None
        assert record.lifecycle is None

    @pytest.mark.unit
    def test_uses_summary_as_excerpt_when_present(self, tmp_path):
        record = build_signal_record(
            FULL_ENTRY, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        assert record.capture.verbatim_excerpt == FULL_ENTRY["summary"]

    @pytest.mark.unit
    def test_falls_back_to_title_when_summary_missing(self, tmp_path):
        entry = dict(FULL_ENTRY, summary="")
        record = build_signal_record(
            entry, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        assert record.capture.verbatim_excerpt == entry["title"]

    @pytest.mark.unit
    def test_falls_back_to_retrieved_at_when_published_missing(self, tmp_path):
        entry = dict(FULL_ENTRY, published_at=None)
        record = build_signal_record(
            entry, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        assert record.capture.published_at == RETRIEVED_AT

    @pytest.mark.unit
    def test_writes_snapshot_file_with_raw_entry(self, tmp_path):
        record = build_signal_record(
            FULL_ENTRY, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        snapshot_file = tmp_path / record.capture.snapshot_path.split("/")[-1]
        assert snapshot_file.exists()
        written = json.loads(snapshot_file.read_text())
        assert written["title"] == FULL_ENTRY["title"]
        assert written["url"] == FULL_ENTRY["url"]

    @pytest.mark.unit
    def test_signal_id_differs_per_cluster_same_content(self, tmp_path):
        record_a = build_signal_record(
            FULL_ENTRY, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path
        )
        record_b = build_signal_record(
            FULL_ENTRY, SOURCE, "export_control_sanctions", RETRIEVED_AT, tmp_path
        )
        assert record_a.signal_meta.signal_id != record_b.signal_meta.signal_id
        assert record_a.capture.content_hash == record_b.capture.content_hash

    @pytest.mark.unit
    def test_raises_on_missing_url(self, tmp_path):
        entry = dict(FULL_ENTRY, url="")
        with pytest.raises(ValueError, match="url"):
            build_signal_record(entry, SOURCE, "trade_policy_tariffs", RETRIEVED_AT, tmp_path)
