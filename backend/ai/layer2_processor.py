"""
Layer 2: Bulk AI Processing with Automatic Fallback

Processes articles in batches using Groq (primary) or Ollama (fallback).
Implements checkpointing for resume capability.

Flow:
1. Load articles that passed Layer 1
2. Process in batches of 10
3. Try Groq first, fallback to Ollama on error
4. Save checkpoint every 50 articles
5. Update database with results
"""

import os
import json
import time
from typing import List, Dict, Any, Tuple
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from ai.providers.groq_client import GroqClient
from ai.providers.ollama_client import OllamaClient
from ai.checkpoint_manager import CheckpointManager


class Layer2Processor:
    """
    Layer 2 bulk processor with automatic fallback.

    Processes filtered articles using AI models in batch mode.
    """

    def __init__(self, provider: str = None, batch_size: int = None):
        """
        Initialize Layer 2 processor.

        Args:
            provider: 'groq', 'ollama', or 'auto' (defaults to env LAYER2_PROVIDER)
            batch_size: Articles per batch (defaults to env LAYER2_BATCH_SIZE or 10)
        """
        self.provider_preference = provider or os.getenv('LAYER2_PROVIDER', 'groq')
        self.batch_size = batch_size or int(os.getenv('LAYER2_BATCH_SIZE', '10'))
        self.checkpoint_interval = int(os.getenv('CHECKPOINT_INTERVAL', '50'))

        # Initialize clients
        self.groq_client = None
        self.ollama_client = None

        # Initialize based on preference
        if self.provider_preference in ['groq', 'auto']:
            try:
                self.groq_client = GroqClient()
                print(f"✅ Groq client initialized")
            except Exception as e:
                print(f"⚠️  Failed to initialize Groq: {e}")

        if self.provider_preference == 'ollama' or (self.provider_preference == 'auto' and self.groq_client is None):
            try:
                self.ollama_client = OllamaClient()
                print(f"✅ Ollama client initialized")
            except Exception as e:
                print(f"⚠️  Failed to initialize Ollama: {e}")

        # Checkpoint manager
        self.checkpoint_manager = CheckpointManager()

        # Tracking
        self.stats = {
            'total_processed': 0,
            'groq_used': 0,
            'ollama_used': 0,
            'fallback_events': [],
            'errors': []
        }

    def process_batch_with_fallback(self, articles: List[Dict]) -> Tuple[List[Dict], str]:
        """
        Process a batch with automatic fallback.

        Args:
            articles: List of article dicts

        Returns:
            Tuple of (results, provider_used)
        """
        # Try Groq first (if available and preferred)
        if self.groq_client and self.provider_preference in ['groq', 'auto']:
            try:
                results = self.groq_client.process_batch(articles)
                self.stats['groq_used'] += len(articles)
                return results, 'groq'

            except Exception as e:
                error_msg = str(e)
                print(f"⚠️  Groq failed: {error_msg}")

                # Log fallback event
                self.stats['fallback_events'].append({
                    'timestamp': datetime.now().isoformat(),
                    'from': 'groq',
                    'to': 'ollama',
                    'reason': error_msg,
                    'articles_remaining': len(articles)
                })

                # Try Ollama fallback
                if self.ollama_client:
                    print(f"🔄 Switching to Ollama fallback...")
                    try:
                        results = self.ollama_client.process_batch(articles)
                        self.stats['ollama_used'] += len(articles)
                        return results, 'ollama'
                    except Exception as ollama_error:
                        print(f"❌ Ollama also failed: {ollama_error}")
                        raise Exception(f"Both Groq and Ollama failed: {error_msg}, {ollama_error}")
                else:
                    raise Exception(f"Groq failed and no Ollama fallback available: {error_msg}")

        # Use Ollama directly if preferred
        elif self.ollama_client and self.provider_preference == 'ollama':
            try:
                results = self.ollama_client.process_batch(articles)
                self.stats['ollama_used'] += len(articles)
                return results, 'ollama'
            except Exception as e:
                raise Exception(f"Ollama processing failed: {e}")

        else:
            raise Exception("No AI provider available")

    def process_articles(self, articles: List[Dict], job_id: str = None) -> Dict[str, Any]:
        """
        Process a list of articles with checkpointing.

        Args:
            articles: List of article dicts with 'id', 'title', 'content'
            job_id: Unique job identifier for checkpointing

        Returns:
            Processing results and statistics
        """
        if not articles:
            return {'processed': 0, 'stats': self.stats}

        # Generate job ID if not provided
        if job_id is None:
            job_id = f"layer2_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        print(f"\n{'='*70}")
        print(f"LAYER 2: BULK PROCESSING")
        print(f"{'='*70}\n")
        print(f"Job ID: {job_id}")
        print(f"Total articles: {len(articles)}")
        print(f"Batch size: {self.batch_size}")
        print(f"Checkpoint interval: Every {self.checkpoint_interval} articles")
        print()

        # Check for existing checkpoint
        checkpoint_data = self.checkpoint_manager.load(job_id)
        start_index = 0

        if checkpoint_data:
            start_index = checkpoint_data.get('last_index', 0) + 1
            print(f"📂 Resuming from checkpoint at index {start_index}")
            print()

        # Process in batches
        results = []
        start_time = time.time()

        for i in range(start_index, len(articles), self.batch_size):
            batch = articles[i:i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            total_batches = (len(articles) + self.batch_size - 1) // self.batch_size

            print(f"[{batch_num}/{total_batches}] Processing articles {i+1}-{min(i+len(batch), len(articles))}...")

            try:
                # Process batch with fallback
                batch_results, provider_used = self.process_batch_with_fallback(batch)

                # Combine article data with results
                for article, result in zip(batch, batch_results):
                    result['article_id'] = article.get('id')
                    result['provider'] = provider_used
                    results.append(result)

                self.stats['total_processed'] += len(batch)

                print(f"  ✅ Processed with {provider_used}")

            except Exception as e:
                print(f"  ❌ Batch failed: {e}")
                self.stats['errors'].append({
                    'batch_index': i,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })

                # Add failed results
                for article in batch:
                    results.append({
                        'article_id': article.get('id'),
                        'article_number': 0,
                        'is_relevant': False,
                        'confidence': 0,
                        'category': 'Processing Failed',
                        'state_codes': [],
                        'summary': '',
                        'error': str(e),
                        'provider': 'none'
                    })

            # Checkpoint every N articles
            if (i + len(batch)) % self.checkpoint_interval == 0:
                checkpoint_data = {
                    'last_index': i + len(batch) - 1,
                    'processed_count': len(results),
                    'total': len(articles),
                    'stats': self.stats,
                    'timestamp': datetime.now().isoformat()
                }
                self.checkpoint_manager.save(job_id, checkpoint_data)
                print(f"  💾 Checkpoint saved ({len(results)} processed)")

        # Processing complete
        elapsed_time = time.time() - start_time

        print(f"\n{'='*70}")
        print(f"PROCESSING COMPLETE")
        print(f"{'='*70}\n")
        print(f"Total processed: {len(results)}")
        print(f"Time: {elapsed_time:.1f} seconds ({elapsed_time/60:.1f} minutes)")
        print(f"Provider usage:")
        print(f"  Groq:   {self.stats['groq_used']} articles")
        print(f"  Ollama: {self.stats['ollama_used']} articles")
        if self.stats['fallback_events']:
            print(f"  Fallbacks: {len(self.stats['fallback_events'])} events")
        if self.stats['errors']:
            print(f"  Errors: {len(self.stats['errors'])}")
        print()

        # Delete checkpoint on success
        self.checkpoint_manager.delete(job_id)

        return {
            'job_id': job_id,
            'processed': len(results),
            'results': results,
            'stats': self.stats,
            'elapsed_seconds': elapsed_time
        }


def test_layer2_processor():
    """Test Layer 2 processor with sample articles."""
    print("\n" + "="*70)
    print("LAYER 2 PROCESSOR TEST")
    print("="*70 + "\n")

    processor = Layer2Processor(provider='auto', batch_size=3)

    test_articles = [
        {
            'id': 1,
            'title': 'IIT Madras launches AI research center',
            'content': 'Indian Institute of Technology Madras announced a new artificial intelligence research center focused on healthcare applications...'
        },
        {
            'id': 2,
            'title': 'Google expands AI team in Bangalore',
            'content': 'Google India is expanding its machine learning team in Bangalore to work on generative AI products for the Indian market...'
        },
        {
            'id': 3,
            'title': 'NITI Aayog releases AI policy framework',
            'content': 'The government think tank published comprehensive guidelines for AI governance in India...'
        },
        {
            'id': 4,
            'title': 'Krutrim AI raises funding',
            'content': 'Indian AI startup Krutrim has raised significant funding for its language model development...'
        },
        {
            'id': 5,
            'title': 'AI regulation bill introduced in Parliament',
            'content': 'A new bill for AI regulation was introduced in the Indian Parliament focusing on data privacy and algorithmic transparency...'
        }
    ]

    results = processor.process_articles(test_articles, job_id='test_layer2')

    print("\n" + "="*70)
    print("SAMPLE RESULTS")
    print("="*70 + "\n")

    for result in results['results'][:3]:
        print(f"Article ID {result['article_id']}:")
        print(f"  Relevant: {result['is_relevant']} ({result['confidence']}%)")
        print(f"  Category: {result['category']}")
        print(f"  States: {result['state_codes']}")
        print(f"  Provider: {result['provider']}")
        print()

    print(f"✅ Layer 2 processor test complete!")


if __name__ == "__main__":
    test_layer2_processor()
