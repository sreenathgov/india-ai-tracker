"""Loads and validates the Signal Intake source registry (sources.json)."""

import json
from dataclasses import dataclass
from pathlib import Path

from signal_intake.models import INTEL_CLUSTERS

DEFAULT_SOURCES_PATH = Path(__file__).resolve().parent.parent / "sources.json"


@dataclass(frozen=True)
class Source:
    name: str
    url: str
    tier: int
    clusters: tuple[str, ...]
    notes: str


def load_sources(path: Path | str = DEFAULT_SOURCES_PATH) -> tuple[Source, ...]:
    """Load, validate, and return the source registry from `path`.

    Raises FileNotFoundError if `path` does not exist, and ValueError for
    any structural or content problem (malformed JSON, missing/invalid
    fields, unknown cluster, duplicate url).
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Source registry not found at {path}")

    try:
        payload = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path} is not valid JSON: {exc}") from exc

    raw_sources = payload.get("sources")
    if not isinstance(raw_sources, list) or not raw_sources:
        raise ValueError(f"{path} must contain a non-empty 'sources' list")

    sources: list[Source] = []
    seen_urls: set[str] = set()
    for index, entry in enumerate(raw_sources):
        source = _parse_entry(entry, index)
        if source.url in seen_urls:
            raise ValueError(f"duplicate url in source registry: {source.url!r}")
        seen_urls.add(source.url)
        sources.append(source)

    return tuple(sources)


def _parse_entry(entry: dict, index: int) -> Source:
    where = f"sources[{index}]"

    name = entry.get("name")
    if not name or not isinstance(name, str):
        raise ValueError(f"{where}: name must be a non-empty string")

    url = entry.get("url")
    if not url or not isinstance(url, str) or not url.startswith(("http://", "https://")):
        raise ValueError(f"{where} ({name!r}): url must be a non-empty http(s) URL")

    tier = entry.get("tier")
    if not isinstance(tier, int) or isinstance(tier, bool) or tier < 1:
        raise ValueError(f"{where} ({name!r}): tier must be an int >= 1")

    clusters = entry.get("clusters")
    if not clusters or not isinstance(clusters, list):
        raise ValueError(f"{where} ({name!r}): clusters must be a non-empty list")
    for cluster in clusters:
        if cluster not in INTEL_CLUSTERS:
            raise ValueError(
                f"{where} ({name!r}): unknown cluster {cluster!r}, "
                f"must be one of {sorted(INTEL_CLUSTERS)}"
            )

    notes = entry.get("notes")
    if not notes or not isinstance(notes, str):
        raise ValueError(f"{where} ({name!r}): notes must be a non-empty string")

    return Source(name=name, url=url, tier=tier, clusters=tuple(clusters), notes=notes)
