"""
UUIDv7 generation for hospital_uid/user_uid — time-ordered, external-safe
identifiers (see docs/mysql_scrpt.sql; internal auto-increment ids must never
reach a URL or a JSON response). Python's stdlib uuid module doesn't gain
uuid7() until 3.14, so it's implemented directly here per RFC 9562: a 48-bit
millisecond Unix timestamp followed by 10 random bytes, with the version and
variant bits set.
"""

import os
import time
import uuid


def uuid7() -> str:
    unix_ts_ms = int(time.time() * 1000)
    raw = bytearray(unix_ts_ms.to_bytes(6, "big") + os.urandom(10))
    raw[6] = (raw[6] & 0x0F) | 0x70  # version 7
    raw[8] = (raw[8] & 0x3F) | 0x80  # variant 10
    return str(uuid.UUID(bytes=bytes(raw)))
