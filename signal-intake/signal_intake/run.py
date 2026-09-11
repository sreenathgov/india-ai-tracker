"""CLI entrypoint: sources -> fetch -> relevance -> capture -> dedup -> append.

Manual invocation only in v1 (no scheduled automation, per design doc).
Run as: python -m signal_intake.run
"""

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from signal_intake.capture import build_signal_record
from signal_intake.dedup import filter_new_records, load_existing_signal_ids
from signal_intake.fetch import fetch_entries
from signal_intake.models import SignalRecord
from signal_intake.relevance import matched_clusters
from signal_intake.source_registry import Source, load_sources

logger = logging.getLogger(__name__)

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_SIGNALS_PATH = DEFAULT_DATA_DIR / "signals.jsonl"
DEFAULT_SNAPSHOT_DIR = DEFAULT_DATA_DIR / "snapshots"


def capture_source(source: Source, retrieved_at: str, snapshot_dir: Path) -> list[SignalRecord]:
    """Fetch one source's feed and build a SignalRecord per (entry, matched cluster)."""
    records: list[SignalRecord] = []
    for entry in fetch_entries(source.url):
        clusters = matched_clusters(
            entry.get("title") or "", entry.get("summary") or "", source.clusters
        )
        for cluster in clusters:
            records.append(build_signal_record(entry, source, cluster, retrieved_at, snapshot_dir))
    return records


def run_capture(
    sources: tuple[Source, ...],
    signals_path: Path,
    snapshot_dir: Path,
    retrieved_at: str | None = None,
) -> tuple[SignalRecord, ...]:
    """Run one full capture pass across all sources; append new records to signals_path.

    A source whose fetch/capture fails is logged and skipped so one dead
    feed doesn't halt a run over many sources (same principle as fetch.py).
    """
    retrieved_at = retrieved_at or datetime.now(timezone.utc).isoformat()

    all_records: list[SignalRecord] = []
    for source in sources:
        try:
            all_records.extend(capture_source(source, retrieved_at, snapshot_dir))
        except Exception:
            logger.exception("Failed to capture source %s (%s)", source.name, source.url)

    existing_signal_ids = load_existing_signal_ids(signals_path)
    new_records = filter_new_records(all_records, existing_signal_ids)
    _append_records(new_records, signals_path)
    return new_records


def _append_records(records: tuple[SignalRecord, ...], signals_path: Path) -> None:
    if not records:
        return
    signals_path = Path(signals_path)
    signals_path.parent.mkdir(parents=True, exist_ok=True)
    with signals_path.open("a") as fh:
        for record in records:
            fh.write(json.dumps(record.to_dict()) + "\n")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Run one Signal Intake capture pass.")
    parser.add_argument(
        "--sources", type=Path, default=None, help="Path to sources.json (default: bundled registry)"
    )
    parser.add_argument("--signals-path", type=Path, default=DEFAULT_SIGNALS_PATH)
    parser.add_argument("--snapshot-dir", type=Path, default=DEFAULT_SNAPSHOT_DIR)
    args = parser.parse_args()

    sources = load_sources(args.sources) if args.sources else load_sources()
    new_records = run_capture(sources, args.signals_path, args.snapshot_dir)
    logger.info("Captured %d new signal(s)", len(new_records))


if __name__ == "__main__":
    main()
