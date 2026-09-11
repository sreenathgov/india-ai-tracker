"""Tests for signal_intake.models — SignalRecord and its component blocks."""

from dataclasses import FrozenInstanceError

import pytest

from signal_intake.models import (
    INTEL_CLUSTERS,
    Authority,
    Capture,
    SignalMeta,
    SignalRecord,
)

VALID_HASH = "a" * 64


def make_signal_meta(**overrides):
    defaults = dict(signal_id="sig-1", intel_cluster="trade_policy_tariffs")
    defaults.update(overrides)
    return SignalMeta(**defaults)


def make_capture(**overrides):
    defaults = dict(
        capture_id="cap-1",
        url="https://example.com/article",
        publisher="Example Publisher",
        published_at="2026-09-10T00:00:00+00:00",
        retrieved_at="2026-09-11T00:00:00+00:00",
        content_hash=VALID_HASH,
        snapshot_path="data/snapshots/cap-1.json",
        verbatim_excerpt="Some excerpt text.",
    )
    defaults.update(overrides)
    return Capture(**defaults)


def make_authority(**overrides):
    defaults = dict(source_tier=1)
    defaults.update(overrides)
    return Authority(**defaults)


class TestSignalMeta:
    @pytest.mark.unit
    def test_valid_construction(self):
        meta = make_signal_meta()
        assert meta.signal_id == "sig-1"
        assert meta.intel_cluster == "trade_policy_tariffs"
        assert meta.thread_id is None
        assert meta.watchlist_item is None

    @pytest.mark.unit
    def test_is_frozen(self):
        meta = make_signal_meta()
        with pytest.raises(FrozenInstanceError):
            meta.signal_id = "other"

    @pytest.mark.unit
    def test_rejects_empty_signal_id(self):
        with pytest.raises(ValueError, match="signal_id"):
            make_signal_meta(signal_id="")

    @pytest.mark.unit
    def test_rejects_unknown_cluster(self):
        with pytest.raises(ValueError, match="intel_cluster"):
            make_signal_meta(intel_cluster="not_a_real_cluster")

    @pytest.mark.unit
    def test_accepts_every_known_cluster(self):
        for cluster in INTEL_CLUSTERS:
            meta = make_signal_meta(intel_cluster=cluster)
            assert meta.intel_cluster == cluster


class TestCapture:
    @pytest.mark.unit
    def test_valid_construction(self):
        capture = make_capture()
        assert capture.url == "https://example.com/article"
        assert capture.content_hash == VALID_HASH

    @pytest.mark.unit
    def test_is_frozen(self):
        capture = make_capture()
        with pytest.raises(FrozenInstanceError):
            capture.url = "https://other.example.com"

    @pytest.mark.unit
    def test_rejects_empty_url(self):
        with pytest.raises(ValueError, match="url"):
            make_capture(url="")

    @pytest.mark.unit
    def test_rejects_non_http_url(self):
        with pytest.raises(ValueError, match="url"):
            make_capture(url="ftp://example.com/article")

    @pytest.mark.unit
    def test_rejects_empty_publisher(self):
        with pytest.raises(ValueError, match="publisher"):
            make_capture(publisher="")

    @pytest.mark.unit
    def test_rejects_empty_verbatim_excerpt(self):
        with pytest.raises(ValueError, match="verbatim_excerpt"):
            make_capture(verbatim_excerpt="")

    @pytest.mark.unit
    def test_rejects_malformed_content_hash(self):
        with pytest.raises(ValueError, match="content_hash"):
            make_capture(content_hash="not-a-sha256-hash")

    @pytest.mark.unit
    def test_rejects_wrong_length_content_hash(self):
        with pytest.raises(ValueError, match="content_hash"):
            make_capture(content_hash="a" * 63)


class TestAuthority:
    @pytest.mark.unit
    def test_valid_construction_defaults_corroboration_state(self):
        authority = make_authority()
        assert authority.source_tier == 1
        assert authority.corroboration_state == "UNCORROBORATED"

    @pytest.mark.unit
    def test_is_frozen(self):
        authority = make_authority()
        with pytest.raises(FrozenInstanceError):
            authority.source_tier = 2

    @pytest.mark.unit
    def test_source_tier_is_plain_int_not_enum(self):
        # Deliberately not a fixed enum: tier 7 should be just as valid as
        # tier 1 so the scheme can extend without a schema change.
        authority = make_authority(source_tier=7)
        assert authority.source_tier == 7

    @pytest.mark.unit
    def test_rejects_zero_or_negative_tier(self):
        with pytest.raises(ValueError, match="source_tier"):
            make_authority(source_tier=0)
        with pytest.raises(ValueError, match="source_tier"):
            make_authority(source_tier=-1)

    @pytest.mark.unit
    def test_rejects_empty_corroboration_state(self):
        with pytest.raises(ValueError, match="corroboration_state"):
            make_authority(corroboration_state="")


class TestSignalRecord:
    @pytest.mark.unit
    def test_valid_construction_leaves_future_blocks_none(self):
        record = SignalRecord(
            signal_meta=make_signal_meta(),
            capture=make_capture(),
            authority=make_authority(),
        )
        assert record.assessment is None
        assert record.graph_links is None
        assert record.weaver_handoff is None
        assert record.lifecycle is None

    @pytest.mark.unit
    def test_is_frozen(self):
        record = SignalRecord(
            signal_meta=make_signal_meta(),
            capture=make_capture(),
            authority=make_authority(),
        )
        with pytest.raises(FrozenInstanceError):
            record.assessment = {"foo": "bar"}

    @pytest.mark.unit
    def test_to_dict_has_all_seven_blocks(self):
        record = SignalRecord(
            signal_meta=make_signal_meta(),
            capture=make_capture(),
            authority=make_authority(),
        )
        as_dict = record.to_dict()
        assert set(as_dict.keys()) == {
            "signal_meta",
            "capture",
            "authority",
            "assessment",
            "graph_links",
            "weaver_handoff",
            "lifecycle",
        }
        assert as_dict["assessment"] is None
        assert as_dict["signal_meta"]["signal_id"] == "sig-1"
        assert as_dict["capture"]["content_hash"] == VALID_HASH
        assert as_dict["authority"]["corroboration_state"] == "UNCORROBORATED"

    @pytest.mark.unit
    def test_to_dict_is_json_serializable(self):
        import json

        record = SignalRecord(
            signal_meta=make_signal_meta(),
            capture=make_capture(),
            authority=make_authority(),
        )
        # Should not raise.
        json.dumps(record.to_dict())
