"""
AI Provider Clients

Unified interface for different AI providers:
- Groq (primary for Layer 2)
- Ollama (fallback for Layer 2)
- Gemini (Layer 3)
"""

from .groq_client import GroqClient
from .ollama_client import OllamaClient

__all__ = ['GroqClient', 'OllamaClient']
