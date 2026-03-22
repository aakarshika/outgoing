"""Parse and validate canonical thread_key strings."""

from __future__ import annotations

import re
from dataclasses import dataclass

USER_RE = re.compile(r"^user:(\d+):(\d+)$")
EVENT_PUBLIC_RE = re.compile(r"^event_public:(\d+)$")
EVENT_VENDOR_RE = re.compile(r"^event_vendor:(\d+)$")
SPECIAL_GROUP_RE = re.compile(r"^special_group:(\d+)$")


@dataclass(frozen=True)
class ParsedUserThread:
    low_id: int
    high_id: int


@dataclass(frozen=True)
class ParsedEventThread:
    event_id: int


@dataclass(frozen=True)
class ParsedSpecialGroupThread:
    group_id: int


def normalize_user_thread(user_a_id: int, user_b_id: int) -> str:
    low, high = sorted((int(user_a_id), int(user_b_id)))
    return f"user:{low}:{high}"


def parse_thread_key(thread_key: str) -> ParsedUserThread | ParsedEventThread | ParsedSpecialGroupThread:
    if not thread_key or len(thread_key) > 256:
        raise ValueError("Invalid thread_key")

    m = USER_RE.match(thread_key)
    if m:
        return ParsedUserThread(low_id=int(m.group(1)), high_id=int(m.group(2)))

    m = EVENT_PUBLIC_RE.match(thread_key)
    if m:
        return ParsedEventThread(event_id=int(m.group(1)))

    m = EVENT_VENDOR_RE.match(thread_key)
    if m:
        return ParsedEventThread(event_id=int(m.group(1)))

    m = SPECIAL_GROUP_RE.match(thread_key)
    if m:
        return ParsedSpecialGroupThread(group_id=int(m.group(1)))

    raise ValueError("Unrecognized thread_key format")


def user_participates_in_user_thread(parsed: ParsedUserThread, user_id: int) -> bool:
    return user_id in (parsed.low_id, parsed.high_id)


def peer_user_id(parsed: ParsedUserThread, sender_id: int) -> int:
    if sender_id == parsed.low_id:
        return parsed.high_id
    if sender_id == parsed.high_id:
        return parsed.low_id
    raise ValueError("Sender is not a member of this user thread")
