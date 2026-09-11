"""Exact-identity dedup against the persisted signals.jsonl log.

Dedup key is signal_id (content_hash + cluster), not content_hash alone:
capture.py deliberately produces two distinct SignalRecords sharing one
content_hash when an item matches two declared clusters, and that must
survive dedup rather than collapse into one record.

Deliberately simple (no fuzzy matching) — see
docs/superpowers/specs/2026-09-11-signal-intake-design.md for why this does
not reuse backend/ai/deduplicator.py.
"""

import json
from pathlib import Path

from signal_intake.models import SignalRecord


def load_existing_signal_ids(signals_path: Path) -> frozenset[str]:
    """Read signal_ids already persisted in signals.jsonl.

    Returns an empty set when the file does not exist yet (first run).
    """
    signals_path = Path(signals_path)
    if not signals_path.exists():
        return frozenset()

    signal_ids: set[str] = set()
    for line in signals_path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"corrupt line in signals.jsonl ({signals_path}): {line!r}") from exc
        signal_ids.add(record["signal_meta"]["signal_id"])

    return frozenset(signal_ids)


def filter_new_records(
    records: list[SignalRecord],
    existing_signal_ids: frozenset[str],
) -> tuple[SignalRecord, ...]:
    """Keep only records not already in existing_signal_ids, in input order.

    Also dedupes within the input batch itself (a repeated signal_id in
    `records` is kept only once).
    """
    seen: set[str] = set()
    new_records: list[SignalRecord] = []
    for record in records:
        signal_id = record.signal_meta.signal_id
        if signal_id in existing_signal_ids or signal_id in seen:
            continue
        seen.add(signal_id)
        new_records.append(record)

    return tuple(new_records)
