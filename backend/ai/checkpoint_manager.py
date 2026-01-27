"""
Checkpoint Manager for Resumable Processing

Saves progress during long-running batch jobs so they can be resumed if interrupted.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional


class CheckpointManager:
    """
    Manages checkpoints for resumable processing.

    Saves progress every N articles so processing can resume if interrupted.
    """

    def __init__(self, checkpoint_dir: str = None):
        """
        Initialize checkpoint manager.

        Args:
            checkpoint_dir: Directory to store checkpoints (defaults to backend/checkpoints)
        """
        if checkpoint_dir is None:
            checkpoint_dir = Path(__file__).parent.parent / 'checkpoints'

        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(exist_ok=True)

    def _get_checkpoint_path(self, job_id: str) -> Path:
        """Get path for a checkpoint file."""
        return self.checkpoint_dir / f"{job_id}.json"

    def save(self, job_id: str, data: Dict[str, Any]):
        """
        Save checkpoint data.

        Args:
            job_id: Unique identifier for the job (e.g., "layer2_2026-01-27")
            data: Checkpoint data to save
        """
        checkpoint_path = self._get_checkpoint_path(job_id)

        checkpoint = {
            'job_id': job_id,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }

        with open(checkpoint_path, 'w') as f:
            json.dump(checkpoint, f, indent=2)

    def load(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Load checkpoint data.

        Args:
            job_id: Job identifier

        Returns:
            Checkpoint data or None if not found
        """
        checkpoint_path = self._get_checkpoint_path(job_id)

        if not checkpoint_path.exists():
            return None

        try:
            with open(checkpoint_path, 'r') as f:
                checkpoint = json.load(f)
                return checkpoint.get('data')
        except (json.JSONDecodeError, IOError) as e:
            print(f"⚠️  Failed to load checkpoint {job_id}: {e}")
            return None

    def exists(self, job_id: str) -> bool:
        """Check if checkpoint exists."""
        return self._get_checkpoint_path(job_id).exists()

    def delete(self, job_id: str):
        """Delete a checkpoint file."""
        checkpoint_path = self._get_checkpoint_path(job_id)
        if checkpoint_path.exists():
            checkpoint_path.unlink()

    def list_checkpoints(self) -> list:
        """List all checkpoint files."""
        if not self.checkpoint_dir.exists():
            return []

        return [f.stem for f in self.checkpoint_dir.glob('*.json')]


def test_checkpoint_manager():
    """Test checkpoint manager."""
    print("\n" + "="*70)
    print("CHECKPOINT MANAGER TEST")
    print("="*70 + "\n")

    manager = CheckpointManager()

    # Test save
    test_data = {
        'last_processed_id': 1234,
        'processed_count': 543,
        'total': 1200,
        'provider': 'groq',
        'started_at': datetime.now().isoformat()
    }

    job_id = "test_job_123"
    manager.save(job_id, test_data)
    print(f"✅ Saved checkpoint: {job_id}")

    # Test exists
    assert manager.exists(job_id), "Checkpoint should exist"
    print(f"✅ Checkpoint exists: {job_id}")

    # Test load
    loaded_data = manager.load(job_id)
    assert loaded_data == test_data, "Loaded data should match saved data"
    print(f"✅ Loaded checkpoint successfully")
    print(f"   Data: {loaded_data}")

    # Test list
    checkpoints = manager.list_checkpoints()
    print(f"\n✅ Found {len(checkpoints)} checkpoint(s): {checkpoints}")

    # Test delete
    manager.delete(job_id)
    assert not manager.exists(job_id), "Checkpoint should be deleted"
    print(f"✅ Deleted checkpoint: {job_id}")

    print("\n✅ All checkpoint manager tests passed!")


if __name__ == "__main__":
    test_checkpoint_manager()
