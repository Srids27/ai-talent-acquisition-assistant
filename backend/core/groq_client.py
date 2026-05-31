"""
Shared Groq client and JSON parsing utilities.
Used by ai_engine.py and resume_scorer.py to avoid code duplication.
"""
import json
import os
import re
from groq import AsyncGroq
from core.config import settings

_client = None


def get_groq_client() -> AsyncGroq:
    """Return a configured Groq async client, initializing it on first call."""
    global _client
    if _client is None:
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env")
        print("[AI] Groq client configured successfully")
        _client = AsyncGroq(api_key=api_key)
    return _client


def safe_json(text: str) -> dict | list:
    """Extract JSON from a model response, stripping markdown fences."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.lower().startswith("json"):
        text = text[4:].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
        if match:
            return json.loads(match.group(1))
        raise
