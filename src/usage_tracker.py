"""Storage for usage counters, admin settings and admin-login failures.

All persistence lives in this module so it can be swapped for another store
(e.g. Firestore) later without touching main.py or the agents.
Currently backed by SQLite (usage.db by default, override with USAGE_DB_PATH).
"""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Dict, List, Optional

DB_PATH = os.getenv("USAGE_DB_PATH") or os.path.join(os.path.dirname(__file__), "..", "usage.db")

# Gemini models the admin can choose from.
AVAILABLE_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro-preview"]

# Google's requests-per-day cap for each model on the owner's API key, read off the
# AI Studio rate-limits page on 2026-10-23. None = not known. Update when the tier changes.
PROVIDER_DAILY_REQUEST_CAPS = {
    "gemini-3.8-flash": 10_000,
    "gemini-3.5-flash": None,
    "gemini-3.5-flash-lite": None,
    "gemini-3.1-pro-preview": 250,
}

MAX_LIMIT = 1_000_000_000
LIMIT_KEYS = ("device_daily_limit", "ip_daily_limit", "global_daily_limit")

GLOBAL_KEY = "global"
ADMIN_KEY = "admin"
DEVICE_PREFIX = "device:"
IP_PREFIX = "ip:"


def _default_device_limit() -> int:
    raw = (os.getenv("DAILY_USER_TOKEN_LIMIT") or "").strip()
    try:
        value = int(raw)
        if 0 <= value <= MAX_LIMIT:
            return value
    except ValueError:
        pass
    return 50000


def default_settings() -> Dict:
    device = _default_device_limit()
    return {
        "default_model": AVAILABLE_MODELS[0],
        "device_daily_limit": device,
        "ip_daily_limit": min(MAX_LIMIT, device * 4),
        "global_daily_limit": 8_000_000,
    }


@contextmanager
def _connect():
    """Open a connection; commit on success, roll back on error, always close."""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        with conn:  # transaction scope
            yield conn
    finally:
        conn.close()


def init_db():
    """Initialize the SQLite database schema if not present."""
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_daily_usage (
                user_id TEXT NOT NULL,
                usage_date TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                request_count INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, usage_date)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS admin_auth_failures (
                ip TEXT NOT NULL,
                usage_date TEXT NOT NULL,
                failures INTEGER DEFAULT 0,
                PRIMARY KEY (ip, usage_date)
            )
        """)


# Ensure DB initialized on module import
init_db()


def get_today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ---------------------------------------------------------------- settings

def get_settings() -> Dict:
    """Current settings: stored values over defaults."""
    settings = default_settings()
    with _connect() as conn:
        rows = conn.execute("SELECT key, value FROM app_settings").fetchall()
    for row in rows:
        key, value = row["key"], row["value"]
        if key == "default_model":
            if value in AVAILABLE_MODELS:
                settings[key] = value
        elif key in LIMIT_KEYS:
            try:
                settings[key] = int(value)
            except ValueError:
                pass
    return settings


def update_settings(changes: Dict) -> Dict:
    """Persist already-validated settings changes in one transaction; returns full settings."""
    if changes:
        with _connect() as conn:
            conn.executemany(
                """
                INSERT INTO app_settings (key, value, last_updated) VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, last_updated = CURRENT_TIMESTAMP
                """,
                [(k, str(v)) for k, v in changes.items()],
            )
    return get_settings()


# ---------------------------------------------------------------- usage subjects

def make_subject(device_id: Optional[str], ip: Optional[str], is_admin: bool = False) -> str:
    """Opaque subject string stored in request.state.user_id and passed back to record_user_usage."""
    if is_admin:
        return ADMIN_KEY
    parts = []
    if device_id:
        parts.append(DEVICE_PREFIX + device_id)
    parts.append(IP_PREFIX + (ip or "unknown"))
    return "|".join(parts)


def _keys_for_subject(subject: str) -> List[str]:
    if subject == ADMIN_KEY:
        return [ADMIN_KEY, GLOBAL_KEY]
    keys = [p for p in subject.split("|") if p.startswith(DEVICE_PREFIX) or p.startswith(IP_PREFIX)]
    if not keys:
        # Unknown legacy subject: still count it globally.
        keys = [IP_PREFIX + subject]
    return keys + [GLOBAL_KEY]


# ---------------------------------------------------------------- usage counters

def get_user_usage(user_id: str, usage_date: str = None) -> Dict:
    """Usage for one counter key (e.g. 'device:<id>', 'ip:<ip>', 'global') on a day."""
    if not usage_date:
        usage_date = get_today_str()
    with _connect() as conn:
        row = conn.execute(
            "SELECT token_count, request_count, last_updated FROM user_daily_usage WHERE user_id = ? AND usage_date = ?",
            (user_id, usage_date),
        ).fetchone()
    return {
        "user_id": user_id,
        "usage_date": usage_date,
        "token_count": row["token_count"] if row else 0,
        "request_count": row["request_count"] if row else 0,
        "last_updated": row["last_updated"] if row else None,
    }


def get_tokens_for_keys(keys: List[str], usage_date: str = None) -> Dict[str, int]:
    """Token counts for several keys today in one query (missing keys -> 0)."""
    if not usage_date:
        usage_date = get_today_str()
    result = {k: 0 for k in keys}
    if not keys:
        return result
    placeholders = ",".join("?" for _ in keys)
    with _connect() as conn:
        rows = conn.execute(
            f"SELECT user_id, token_count FROM user_daily_usage WHERE usage_date = ? AND user_id IN ({placeholders})",
            [usage_date, *keys],
        ).fetchall()
    for row in rows:
        result[row["user_id"]] = row["token_count"]
    return result


def record_user_usage(user_id: str, tokens: int, usage_date: str = None) -> Dict:
    """Atomically record tokens + one request against every key of the subject (one transaction).

    `user_id` is the opaque subject from make_subject (what main.py puts in request.state.user_id).
    """
    if not usage_date:
        usage_date = get_today_str()
    tokens = max(1, int(tokens or 0))
    keys = _keys_for_subject(user_id or "anonymous")
    with _connect() as conn:
        conn.executemany(
            """
            INSERT INTO user_daily_usage (user_id, usage_date, token_count, request_count, last_updated)
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, usage_date) DO UPDATE SET
                token_count = token_count + excluded.token_count,
                request_count = request_count + 1,
                last_updated = CURRENT_TIMESTAMP
            """,
            [(k, usage_date, tokens) for k in keys],
        )
    return get_user_usage(keys[0], usage_date)


def get_usage_overview(limit: int = 50, usage_date: str = None) -> Dict:
    """Today's global totals plus top devices and IPs by tokens."""
    if not usage_date:
        usage_date = get_today_str()

    def top(conn, prefix: str) -> List[Dict]:
        rows = conn.execute(
            """
            SELECT user_id, token_count, request_count FROM user_daily_usage
            WHERE usage_date = ? AND substr(user_id, 1, ?) = ?
            ORDER BY token_count DESC, user_id ASC LIMIT ?
            """,
            (usage_date, len(prefix), prefix, limit),
        ).fetchall()
        return [
            {"id": r["user_id"][len(prefix):], "tokens": r["token_count"], "requests": r["request_count"]}
            for r in rows
        ]

    with _connect() as conn:
        g = conn.execute(
            "SELECT token_count, request_count FROM user_daily_usage WHERE user_id = ? AND usage_date = ?",
            (GLOBAL_KEY, usage_date),
        ).fetchone()
        devices = top(conn, DEVICE_PREFIX)
        ips = top(conn, IP_PREFIX)
    return {
        "usage_date": usage_date,
        "global_tokens": g["token_count"] if g else 0,
        "global_requests": g["request_count"] if g else 0,
        "devices": devices,
        "ips": ips,
    }


def get_usage_history(days: int = 7) -> Dict:
    """Global totals for the most recent days that have usage, plus all-time totals."""
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT usage_date, token_count, request_count FROM user_daily_usage
            WHERE user_id = ? ORDER BY usage_date DESC LIMIT ?
            """,
            (GLOBAL_KEY, days),
        ).fetchall()
        totals_sql = "SELECT COALESCE(SUM(token_count), 0) AS t, COALESCE(SUM(request_count), 0) AS r FROM user_daily_usage WHERE user_id = ?"
        total = conn.execute(totals_sql, (GLOBAL_KEY,)).fetchone()
        admin_total = conn.execute(totals_sql, (ADMIN_KEY,)).fetchone()
        admin_today = conn.execute(
            "SELECT token_count, request_count FROM user_daily_usage WHERE user_id = ? AND usage_date = ?",
            (ADMIN_KEY, get_today_str()),
        ).fetchone()
    return {
        "history": [{"date": r["usage_date"], "tokens": r["token_count"], "requests": r["request_count"]} for r in rows],
        "all_time_tokens": total["t"],
        "all_time_requests": total["r"],
        # The owner's own usage (requests sent with a valid admin code)
        "admin_tokens": admin_today["token_count"] if admin_today else 0,
        "admin_requests": admin_today["request_count"] if admin_today else 0,
        "admin_all_time_tokens": admin_total["t"],
        "admin_all_time_requests": admin_total["r"],
    }


# ---------------------------------------------------------------- admin brute-force guard

def get_admin_failures(ip: str, usage_date: str = None) -> int:
    if not usage_date:
        usage_date = get_today_str()
    with _connect() as conn:
        row = conn.execute(
            "SELECT failures FROM admin_auth_failures WHERE ip = ? AND usage_date = ?", (ip, usage_date)
        ).fetchone()
    return row["failures"] if row else 0


def record_admin_failure(ip: str, usage_date: str = None) -> int:
    if not usage_date:
        usage_date = get_today_str()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO admin_auth_failures (ip, usage_date, failures) VALUES (?, ?, 1)
            ON CONFLICT(ip, usage_date) DO UPDATE SET failures = failures + 1
            """,
            (ip, usage_date),
        )
    return get_admin_failures(ip, usage_date)


# ---------------------------------------------------------------- token extraction

def extract_tokens_from_llm_response(response, fallback_text: str = "") -> int:
    """Extract total tokens from LLM AIMessage response or estimate based on text length."""
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        um = response.usage_metadata
        if isinstance(um, dict):
            total = um.get("total_tokens", um.get("input_tokens", 0) + um.get("output_tokens", 0))
            if total and total > 0:
                return total

    if hasattr(response, "response_metadata") and isinstance(response.response_metadata, dict):
        rm = response.response_metadata
        usage = rm.get("usage_metadata") or rm.get("token_usage") or {}
        if isinstance(usage, dict):
            total = usage.get("total_token_count", usage.get("total_tokens"))
            if total is not None and total > 0:
                return total
            prompt = usage.get("prompt_token_count", usage.get("prompt_tokens", 0))
            candidates = usage.get("candidates_token_count", usage.get("completion_tokens", 0))
            if prompt or candidates:
                return prompt + candidates

    # Fallback estimate (character count / 4 for prompt + response estimate)
    content_str = str(getattr(response, "content", "")) if hasattr(response, "content") else str(response)
    text_len = len(fallback_text) + len(content_str)
    return max(50, text_len // 4)
