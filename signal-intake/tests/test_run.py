"""Tests for signal_intake.run — CLI orchestration: sources -> fetch ->
relevance -> capture -> dedup -> append.

fetch_entries is monkeypatched throughout; no live network calls and no
writes outside tmp_path.
"""

import json

import pytest

from signal_intake import run
from signal_intake.source_registry import Source

SOURCE_A = Source(
    name="Example Regulator",
    url="https://example.gov/rss.xml",
    tier=1,
    clusters=("trade_policy_tariffs",),
    notes="test source",
)

SOURCE_B = Source(
    name="Example Newswire",
    url="https://example.com/newswire.xml",
    tier=2,
    clusters=("export_control_sanctions",),
    notes="test source",
)

RETRIEVED_AT = "2026-09-11T00:00:00+00:00"

TARIFF_ENTRY = {
    "title": "US announces new tariff on steel",
    "url": "https://example.gov/news/steel-tariff",
    "summary": "A new tariff was imposed on steel imports.",
    "published_at": "2026-09-10T12:00:00+00:00",
}

IRRELEVANT_ENTRY = {
    "title": "Local weather forecast",
    "url": "https://example.gov/news/weather",
    "summary": "Sunny with a chance of rain.",
    "published_at": "2026-09-10T12:00:00+00:00",
}


class TestCaptureSource:
    @pytest.mark.unit
    def test_builds_record_per_matched_entry(self, monkeypatch, tmp_path):
        monkeypatch.setattr(run, "fetch_entries", lambda url: [TARIFF_ENTRY])

        records = run.capture_source(SOURCE_A, RETRIEVED_AT, tmp_path)

        assert len(records) == 1
        assert records[0].signal_meta.intel_cluster == "trade_policy_tariffs"

    @pytest.mark.unit
    def test_no_entries_yields_no_records(self, monkeypatch, tmp_path):
        monkeypatch.setattr(run, "fetch_entries", lambda url: [])

        assert run.capture_source(SOURCE_A, RETRIEVED_AT, tmp_path) == []

    @pytest.mark.unit
    def test_irrelevant_entry_yields_no_records(self, monkeypatch, tmp_path):
        monkeypatch.setattr(run, "fetch_entries", lambda url: [IRRELEVANT_ENTRY])

        assert run.capture_source(SOURCE_A, RETRIEVED_AT, tmp_path) == []


class TestRunCapture:
    @pytest.mark.unit
    def test_writes_new_records_to_signals_path(self, monkeypatch, tmp_path):
        monkeypatch.setattr(run, "fetch_entries", lambda url: [TARIFF_ENTRY])
        signals_path = tmp_path / "signals.jsonl"

        new_records = run.run_capture(
            (SOURCE_A,), signals_path, tmp_path / "snapshots", RETRIEVED_AT
        )

        assert len(new_records) == 1
        lines = signals_path.read_text().strip().splitlines()
        assert len(lines) == 1
        written = json.loads(lines[0])
        assert written["signal_meta"]["signal_id"] == new_records[0].signal_meta.signal_id

    @pytest.mark.unit
    def test_does_not_reappend_already_captured_signals(self, monkeypatch, tmp_path):
        monkeypatch.setattr(run, "fetch_entries", lambda url: [TARIFF_ENTRY])
        signals_path = tmp_path / "signals.jsonl"

        run.run_capture((SOURCE_A,), signals_path, tmp_path / "snapshots", RETRIEVED_AT)
        second_pass = run.run_capture(
            (SOURCE_A,), signals_path, tmp_path / "snapshots", RETRIEVED_AT
        )

        assert second_pass == ()
        assert len(signals_path.read_text().strip().splitlines()) == 1

    @pytest.mark.unit
    def test_one_failing_source_does_not_block_others(self, monkeypatch, tmp_path):
        def fake_fetch(url):
            if url == SOURCE_A.url:
                raise RuntimeError("boom")
            return [TARIFF_ENTRY]

        monkeypatch.setattr(run, "fetch_entries", fake_fetch)
        signals_path = tmp_path / "signals.jsonl"

        source_b_matching = Source(
            name=SOURCE_B.name,
            url=SOURCE_B.url,
            tier=SOURCE_B.tier,
            clusters=("trade_policy_tariffs",),
            notes=SOURCE_B.notes,
        )

        new_records = run.run_capture(
            (SOURCE_A, source_b_matching), signals_path, tmp_path / "snapshots", RETRIEVED_AT
        )

        assert len(new_records) == 1
        assert new_records[0].capture.publisher == source_b_matching.name

    @pytest.mark.unit
    def test_no_new_records_leaves_no_file(self, monkeypatch, tmp_path):
        monkeypatch.setattr(run, "fetch_entries", lambda url: [])
        signals_path = tmp_path / "signals.jsonl"

        new_records = run.run_capture(
            (SOURCE_A,), signals_path, tmp_path / "snapshots", RETRIEVED_AT
        )

        assert new_records == ()
        assert not signals_path.exists()
