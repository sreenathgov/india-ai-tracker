"""
Cost circuit breaker for the paid Layer-2 LLM step.

Layer 1 (rule-based regex) is free, and Layer 3 (Gemini) is already bounded to a
top-N selection. Layer 2 (Groq) is the unbounded paid step: it processes every
article that survives Layer 1. A runaway scrape — infinite pagination, a redirect
loop, or a mis-configured high-volume source — would otherwise translate directly
into unbounded Groq spend.

enforce_layer2_cap bounds the number of articles handed to Layer 2 per run. It
truncates rather than aborts: articles arrive priority-ordered (content-rich and
recent first), so keeping the leading N preserves the most valuable work while
capping cost, and the daily run still produces output instead of failing wholesale.
The caller is responsible for loudly logging any drop (no silent truncation).
"""

from typing import Any, Dict, List, Optional, Tuple


def enforce_layer2_cap(
    articles: List[Dict[str, Any]],
    max_articles: Optional[int],
) -> Tuple[List[Dict[str, Any]], int]:
    """Bound the number of articles sent to the paid Layer-2 LLM.

    Args:
        articles: Priority-ordered articles that passed Layer 1.
        max_articles: Maximum to allow through. None or <= 0 disables the cap.

    Returns:
        (capped_articles, dropped_count). capped_articles is always a new list.
    """
    if max_articles is None or max_articles <= 0:
        return list(articles), 0
    if len(articles) <= max_articles:
        return list(articles), 0
    return list(articles[:max_articles]), len(articles) - max_articles
