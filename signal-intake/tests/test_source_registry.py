"""Tests for signal_intake.source_registry."""

import json
from dataclasses import FrozenInstanceError

import pytest

from signal_intake.source_registry import DEFAULT_SOURCES_PATH, Source, load_sources

VALID_PAYLOAD = {
    "sources": [
        {
            "name": "Example Regulator",
            "url": "https://example.gov/rss.xml",
            "tier": 1,
            "clusters": ["trade_policy_tariffs"],
            "notes": "Official regulator feed.",
        },
        {
            "name": "Example Press",
            "url": "https://example.com/feed",
            "tier": 2,
            "clusters": ["supply_chain_disruption_inputs", "market_funding_competition"],
            "notes": "Trade press with dual-cluster coverage.",
        },
    ]
}


def write_payload(tmp_path, payload):
    path = tmp_path / "sources.json"
    path.write_text(json.dumps(payload))
    return path


class TestLoadSources:
    @pytest.mark.unit
    def test_loads_valid_sources(self, tmp_path):
        path = write_payload(tmp_path, VALID_PAYLOAD)
        sources = load_sources(path)
        assert len(sources) == 2
        assert sources[0].name == "Example Regulator"
        assert sources[0].clusters == ("trade_policy_tariffs",)
        assert sources[1].clusters == (
            "supply_chain_disruption_inputs",
            "market_funding_competition",
        )

    @pytest.mark.unit
    def test_source_is_frozen(self, tmp_path):
        path = write_payload(tmp_path, VALID_PAYLOAD)
        sources = load_sources(path)
        with pytest.raises(FrozenInstanceError):
            sources[0].name = "Changed"

    @pytest.mark.unit
    def test_rejects_missing_file(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            load_sources(tmp_path / "does_not_exist.json")

    @pytest.mark.unit
    def test_rejects_malformed_json(self, tmp_path):
        path = tmp_path / "sources.json"
        path.write_text("{not valid json")
        with pytest.raises(ValueError, match="valid JSON"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_missing_required_field(self, tmp_path):
        payload = {"sources": [{"name": "No URL", "tier": 1, "clusters": ["trade_policy_tariffs"], "notes": "x"}]}
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="url"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_empty_clusters(self, tmp_path):
        payload = {
            "sources": [
                {
                    "name": "No clusters",
                    "url": "https://example.com/feed",
                    "tier": 1,
                    "clusters": [],
                    "notes": "x",
                }
            ]
        }
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="clusters"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_unknown_cluster(self, tmp_path):
        payload = {
            "sources": [
                {
                    "name": "Bad cluster",
                    "url": "https://example.com/feed",
                    "tier": 1,
                    "clusters": ["not_a_real_cluster"],
                    "notes": "x",
                }
            ]
        }
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="not_a_real_cluster"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_non_positive_tier(self, tmp_path):
        payload = {
            "sources": [
                {
                    "name": "Bad tier",
                    "url": "https://example.com/feed",
                    "tier": 0,
                    "clusters": ["trade_policy_tariffs"],
                    "notes": "x",
                }
            ]
        }
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="tier"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_non_http_url(self, tmp_path):
        payload = {
            "sources": [
                {
                    "name": "Bad url",
                    "url": "not-a-url",
                    "tier": 1,
                    "clusters": ["trade_policy_tariffs"],
                    "notes": "x",
                }
            ]
        }
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="url"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_duplicate_urls(self, tmp_path):
        payload = {
            "sources": [
                {
                    "name": "First",
                    "url": "https://example.com/feed",
                    "tier": 1,
                    "clusters": ["trade_policy_tariffs"],
                    "notes": "x",
                },
                {
                    "name": "Second",
                    "url": "https://example.com/feed",
                    "tier": 1,
                    "clusters": ["trade_policy_tariffs"],
                    "notes": "y",
                },
            ]
        }
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="duplicate"):
            load_sources(path)

    @pytest.mark.unit
    def test_rejects_empty_notes(self, tmp_path):
        payload = {
            "sources": [
                {
                    "name": "No justification",
                    "url": "https://example.com/feed",
                    "tier": 1,
                    "clusters": ["trade_policy_tariffs"],
                    "notes": "",
                }
            ]
        }
        path = write_payload(tmp_path, payload)
        with pytest.raises(ValueError, match="notes"):
            load_sources(path)


class TestDefaultRegistry:
    @pytest.mark.unit
    def test_default_sources_file_loads(self):
        sources = load_sources(DEFAULT_SOURCES_PATH)
        assert len(sources) >= 12
        for source in sources:
            assert isinstance(source, Source)
            assert source.url.startswith(("http://", "https://"))
            assert source.clusters
