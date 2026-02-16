"""Generic AI service for any LLM needs.

This module provides a reusable wrapper around the OpenAI Chat Completions API.
Use it from any app (content generation, summarization, classification, etc.)
by calling `complete()` with your system and user prompts.

Example usage:

    from core.ai import complete, EXAMPLE_SYSTEM_PROMPT, EXAMPLE_USER_PROMPT

    response = complete(
        system_prompt=EXAMPLE_SYSTEM_PROMPT,
        user_prompt=EXAMPLE_USER_PROMPT,
    )
"""

from __future__ import annotations

from typing import Any, Optional, Sequence

from django.conf import settings

try:
    from openai import OpenAI
except ImportError as exc:
    raise ImportError(
        "The 'openai' package is required for the AI service. "
        "Install it with: pip install openai"
    ) from exc


_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = getattr(settings, "OPENAI_API_KEY", None) or None
        _client = OpenAI(api_key=api_key)
    return _client


def _default_model() -> str:
    return getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")


# -----------------------------------------------------------------------------
# Example prompts (for reference and quick experiments)
# -----------------------------------------------------------------------------

EXAMPLE_SYSTEM_PROMPT = """You are a helpful assistant. You answer concisely and clearly.
If you don't know something, say so. Use a friendly, professional tone."""

EXAMPLE_USER_PROMPT = """Say hello and tell me in one sentence what you can help with."""


# -----------------------------------------------------------------------------
# Core API
# -----------------------------------------------------------------------------


def build_messages(
    user_prompt: str,
    system_prompt: Optional[str] = None,
    extra_messages: Optional[Sequence[dict[str, str]]] = None,
) -> list[dict[str, str]]:
    """
    Build a messages list for the Chat Completions API.

    - If `system_prompt` is given, it is added as the first system message.
    - `extra_messages` (e.g. previous assistant/user turns) are inserted
      after the system message and before the final user message.
    """
    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    if extra_messages:
        messages.extend(extra_messages)
    messages.append({"role": "user", "content": user_prompt})
    return messages


def complete(
    user_prompt: str,
    *,
    system_prompt: Optional[str] = None,
    extra_messages: Optional[Sequence[dict[str, str]]] = None,
    model: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
) -> str:
    """
    Call the LLM with the given prompts and return the assistant reply as text.

    Use this for any AI need: content generation, summarization, classification,
    Q&A, etc. Pass your task description in `system_prompt` and the concrete
    input in `user_prompt`.

    If OPENAI_API_KEY is not set or the API call fails, returns an empty string.
    """
    if not user_prompt.strip():
        return ""

    if not getattr(settings, "OPENAI_API_KEY", ""):
        return ""

    try:
        client = _get_client()
        messages = build_messages(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            extra_messages=extra_messages,
        )
        completion = client.chat.completions.create(
            model=model or _default_model(),
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = completion.choices[0].message.content if completion.choices else ""
        return (content or "").strip()
    except Exception:
        return ""


def example_completion() -> str:
    """
    Example function that uses the example system and user prompts.
    Call this to verify the AI service is wired correctly, or copy it
    as a template for your own functions.
    """
    return complete(
        system_prompt=EXAMPLE_SYSTEM_PROMPT,
        user_prompt=EXAMPLE_USER_PROMPT,
        max_tokens=150,
        temperature=0.5,
    )
