"""Immutable SignalRecord schema for Signal Intake.

SignalRecord carries all seven blocks defined for the Continuous
Intelligence architecture from v1 onward. This workstream only populates
signal_meta, capture, and authority; assessment, graph_links,
weaver_handoff, and lifecycle are explicit None placeholders for later
workstreams so this shape does not need to change when they land.
"""

import re
from dataclasses import asdict, dataclass
from typing import Any

INTEL_CLUSTERS = frozenset(
    {
        "trade_policy_tariffs",
        "export_control_sanctions",
        "working_capital_trade_finance",
        "supply_chain_disruption_inputs",
        "esg_cbam_labour_compliance",
        "market_funding_competition",
        "ai_governed_technology",
    }
)

_SHA256_HEX_RE = re.compile(r"^[0-9a-f]{64}$")


@dataclass(frozen=True)
class SignalMeta:
    signal_id: str
    intel_cluster: str
    thread_id: str | None = None
    watchlist_item: str | None = None

    def __post_init__(self) -> None:
        if not self.signal_id:
            raise ValueError("signal_id must be non-empty")
        if self.intel_cluster not in INTEL_CLUSTERS:
            raise ValueError(
                f"intel_cluster must be one of {sorted(INTEL_CLUSTERS)}, "
                f"got {self.intel_cluster!r}"
            )


@dataclass(frozen=True)
class Capture:
    capture_id: str
    url: str
    publisher: str
    published_at: str
    retrieved_at: str
    content_hash: str
    snapshot_path: str
    verbatim_excerpt: str

    def __post_init__(self) -> None:
        if not self.capture_id:
            raise ValueError("capture_id must be non-empty")
        if not self.url or not self.url.startswith(("http://", "https://")):
            raise ValueError(f"url must be a non-empty http(s) URL, got {self.url!r}")
        if not self.publisher:
            raise ValueError("publisher must be non-empty")
        if not self.published_at:
            raise ValueError("published_at must be non-empty")
        if not self.retrieved_at:
            raise ValueError("retrieved_at must be non-empty")
        if not _SHA256_HEX_RE.match(self.content_hash):
            raise ValueError(
                f"content_hash must be a 64-char lowercase hex sha256 digest, "
                f"got {self.content_hash!r}"
            )
        if not self.snapshot_path:
            raise ValueError("snapshot_path must be non-empty")
        if not self.verbatim_excerpt:
            raise ValueError("verbatim_excerpt must be non-empty")


@dataclass(frozen=True)
class Authority:
    source_tier: int
    corroboration_state: str = "UNCORROBORATED"

    def __post_init__(self) -> None:
        if self.source_tier < 1:
            raise ValueError(f"source_tier must be >= 1, got {self.source_tier}")
        if not self.corroboration_state:
            raise ValueError("corroboration_state must be non-empty")


@dataclass(frozen=True)
class SignalRecord:
    signal_meta: SignalMeta
    capture: Capture
    authority: Authority
    assessment: dict[str, Any] | None = None
    graph_links: dict[str, Any] | None = None
    weaver_handoff: dict[str, Any] | None = None
    lifecycle: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
