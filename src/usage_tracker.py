import os
import sqlite3
from datetime import datetime
from typing import Dict, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "usage.db")
DEFAULT_DAILY_TOKEN_LIMIT = int(os.getenv("DAILY_USER_TOKEN_LIMIT", "50000"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the SQLite database schema if not present."""
    with get_db_connection() as conn:
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
        conn.commit()

# Ensure DB initialized on module import
init_db()

def get_today_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")

def get_user_usage(user_id: str, usage_date: str = None) -> Dict:
    """Get current day usage for a given user_id."""
    if not usage_date:
        usage_date = get_today_str()
        
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, usage_date, token_count, request_count, last_updated FROM user_daily_usage WHERE user_id = ? AND usage_date = ?",
            (user_id, usage_date)
        )
        row = cursor.fetchone()
        if row:
            return {
                "user_id": row["user_id"],
                "usage_date": row["usage_date"],
                "token_count": row["token_count"],
                "request_count": row["request_count"],
                "last_updated": row["last_updated"]
            }
        return {
            "user_id": user_id,
            "usage_date": usage_date,
            "token_count": 0,
            "request_count": 0,
            "last_updated": None
        }

def is_user_within_quota(user_id: str, limit: int = None) -> Tuple[bool, int, int]:
    """
    Check if user is within quota.
    Returns (is_allowed, current_tokens, limit).
    """
    if limit is None:
        limit = int(os.getenv("DAILY_USER_TOKEN_LIMIT", "50000"))
        
    usage = get_user_usage(user_id)
    current_tokens = usage["token_count"]
    is_allowed = current_tokens < limit
    return is_allowed, current_tokens, limit


def record_user_usage(user_id: str, tokens: int, usage_date: str = None) -> Dict:
    """Atomically record token usage and increment request count for user."""
    if not usage_date:
        usage_date = get_today_str()
        
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_daily_usage (user_id, usage_date, token_count, request_count, last_updated)
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, usage_date) DO UPDATE SET
                token_count = token_count + excluded.token_count,
                request_count = request_count + 1,
                last_updated = CURRENT_TIMESTAMP
        """, (user_id, usage_date, max(1, tokens)))
        conn.commit()
        
    return get_user_usage(user_id, usage_date)

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

