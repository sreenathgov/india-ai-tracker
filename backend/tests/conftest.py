"""Unit tests must never use a developer's live language-model credentials."""
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@pytest.fixture(autouse=True)
def no_live_model_credentials(monkeypatch):
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
