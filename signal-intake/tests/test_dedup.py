"""Tests for signal_intake.dedup — exact-identity dedup against signals.jsonl.

Dedup key is signal_id (content_hash + cluster), not content_hash alone:
capture.py deliberately produces two distinct SignalRecords sharing one
content_hash when an item matches two clusters, and dedup must not collapse
those into one.
"""

import json

import pytest

from signal_intake.capture import build_signal_record
from signal_intake.dedup import filter_new_records, load_existing_signal_ids
from signal_intake.source_registry import Source

SOURCE = Source(
    name="Example Regulator",
    url="https://example.gov/rss.xml",
    tier=1,
    clusters=("trade_policy_tariffs", "export_control_sanctions"),
    notes="test source",
)

ENTRY_A = {
    "title": "US announces new tariff on steel",
    "url": "https://example.gov/news/steel-tariff",
    "summary": "The US announced a new tariff on steel imports today.",
    "published_at": "2026-09-10T12:00:00+00:00",
}

ENTRY_B = {
    "title": "EU sanctions update",
    "url": "https://example.gov/news/eu-sanctions",
    "summary": "The EU updated its sanctions list.",
    "published_at": "2026-09-10T12:00:00+00:00",
}

RETRIEVED_AT = "2026-09-11T00:00:00+00:00"


def _record(entry, cluster, snapshot_dir):
    return build_signal_record(entry, SOURCE, cluster, RETRIEVED_AT, snapshot_dir)


class TestLoadExistingSignalIds:
    @pytest.mark.unit
    def test_missing_file_returns_empty_set(self, tmp_path):
        signal_ids = load_existing_signal_ids(tmp_path / "signals.jsonl")
        assert signal_ids == frozenset()

    @pytest.mark.unit
    def test_reads_signal_ids_from_jsonl(self, tmp_path, snapshot_dir=None):
        snapshot_dir = tmp_path / "snapshots"
        record_a = _record(ENTRY_A, "trade_policy_tariffs", snapshot_dir)
        record_b = _record(ENTRY_B, "export_control_sanctions", snapshot_dir)
        signals_path = tmp_path / "signals.jsonl"
        signals_path.write_text(
            json.dumps(record_a.to_dict()) + "\n" + json.dumps(record_b.to_dict()) + "\n"
        )

        signal_ids = load_existing_signal_ids(signals_path)

        assert signal_ids == {record_a.signal_meta.signal_id, record_b.signal_meta.signal_id}

    @pytest.mark.unit
    def test_skips_blank_lines(self, tmp_path):
        snapshot_dir = tmp_path / "snapshots"
        record_a = _record(ENTRY_A, "trade_policy_tariffs", snapshot_dir)
        signals_path = tmp_path / "signals.jsonl"
        signals_path.write_text("\n" + json.dumps(record_a.to_dict()) + "\n\n")

        signal_ids = load_existing_signal_ids(signals_path)

        assert signal_ids == {record_a.signal_meta.signal_id}

    @pytest.mark.unit
    def test_raises_on_malformed_line(self, tmp_path):
        signals_path = tmp_path / "signals.jsonl"
        signals_path.write_text("not json\n")

        with pytest.raises(ValueError, match="signals.jsonl"):
            load_existing_signal_ids(signals_path)


class TestFilterNewRecords:
    @pytest.mark.unit
    def test_keeps_record_with_new_signal_id(self, tmp_path):
        record = _record(ENTRY_A, "trade_policy_tariffs", tmp_path)

        result = filter_new_records([record], frozenset())

        assert result == (record,)

    @pytest.mark.unit
    def test_drops_record_already_in_existing_set(self, tmp_path):
        record = _record(ENTRY_A, "trade_policy_tariffs", tmp_path)

        result = filter_new_records([record], frozenset({record.signal_meta.signal_id}))

        assert result == ()

    @pytest.mark.unit
    def test_preserves_order(self, tmp_path):
        record_a = _record(ENTRY_A, "trade_policy_tariffs", tmp_path)
        record_b = _record(ENTRY_B, "export_control_sanctions", tmp_path)

        result = filter_new_records([record_a, record_b], frozenset())

        assert result == (record_a, record_b)

    @pytest.mark.unit
    def test_dedupes_within_same_batch(self, tmp_path):
        record = _record(ENTRY_A, "trade_policy_tariffs", tmp_path)

        result = filter_new_records([record, record], frozenset())

        assert result == (record,)

    @pytest.mark.unit
    def test_keeps_both_clusters_for_shared_content_hash(self, tmp_path):
        record_a = _record(ENTRY_A, "trade_policy_tariffs", tmp_path)
        record_b = _record(ENTRY_A, "export_control_sanctions", tmp_path)
        assert record_a.capture.content_hash == record_b.capture.content_hash

        result = filter_new_records([record_a, record_b], frozenset())

        assert result == (record_a, record_b)

    @pytest.mark.unit
    def test_empty_inputs_return_empty_tuple(self):
        assert filter_new_records([], frozenset()) == ()
