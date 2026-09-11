"""Builds a SignalRecord from a normalized feed entry plus source metadata.

Consumes the normalized entry shape produced by fetch.py:
{"title": str, "url": str, "summary": str, "published_at": str | None}
so this module stays decoupled from feedparser specifics.
"""

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from signal_intake.models import Authority, Capture, SignalMeta, SignalRecord
from signal_intake.source_registry import Source

_WHITESPACE_RE = re.compile(r"\s+")


def _normalize(text: str) -> str:
    return _WHITESPACE_RE.sub(" ", text.strip().lower())


def compute_content_hash(url: str, title: str, summary: str) -> str:
    """sha256 of the normalized url+title+summary.

    Detects "already captured this exact item" across runs. Not intended
    for cross-publisher corroboration — different outlets covering the
    same event hash differently by design.
    """
    normalized = f"{_normalize(url)}|{_normalize(title)}|{_normalize(summary)}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _write_snapshot(snapshot_dir: Path, capture_id: str, entry: dict[str, Any]) -> Path:
    snapshot_dir = Path(snapshot_dir)
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    snapshot_file = snapshot_dir / f"{capture_id}.json"
    snapshot_file.write_text(json.dumps(entry, indent=2))
    return snapshot_file


def build_signal_record(
    entry: dict[str, Any],
    source: Source,
    cluster: str,
    retrieved_at: str,
    snapshot_dir: Path,
) -> SignalRecord:
    """Build an immutable SignalRecord for one (entry, cluster) pairing.

    A single captured item relevant to multiple clusters produces one
    SignalRecord per cluster (signal_meta.intel_cluster is singular), each
    sharing the same content_hash but a distinct signal_id.
    """
    title = entry.get("title") or ""
    url = entry.get("url") or ""
    summary = entry.get("summary") or ""
    published_at = entry.get("published_at") or retrieved_at
    verbatim_excerpt = summary or title

    content_hash = compute_content_hash(url, title, summary)
    capture_id = f"cap-{content_hash[:16]}"
    signal_id = f"sig-{content_hash[:16]}-{cluster}"

    snapshot_file = _write_snapshot(snapshot_dir, capture_id, entry)

    signal_meta = SignalMeta(signal_id=signal_id, intel_cluster=cluster)
    capture = Capture(
        capture_id=capture_id,
        url=url,
        publisher=source.name,
        published_at=published_at,
        retrieved_at=retrieved_at,
        content_hash=content_hash,
        snapshot_path=str(snapshot_file),
        verbatim_excerpt=verbatim_excerpt,
    )
    authority = Authority(source_tier=source.tier)

    return SignalRecord(signal_meta=signal_meta, capture=capture, authority=authority)
