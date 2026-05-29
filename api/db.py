import psycopg2
import os
from dotenv import load_dotenv
from psycopg2 import pool

load_dotenv()

# Lazily create the connection pool so module import doesn't fail
_pool = None

def _get_pool():
    global _pool
    if _pool is None:
        dsn = os.environ.get("DATABASE_URL")
        if not dsn:
            raise RuntimeError("DATABASE_URL environment variable is not set")
        _pool = psycopg2.pool.SimpleConnectionPool(minconn=1, maxconn=10, dsn=dsn)
    return _pool

def query(sql, params=None):
    p = _get_pool()
    conn = None
    try:
        conn = p.getconn()
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        if conn is not None:
            p.putconn(conn)
            
            
# def get_state(key: str):
#     rows = query("SELECT value FROM app_state WHERE key = %s", (key,))
#     return rows[0][0] if rows else None

# def set_state(key: str, value: str):
#     p = _get_pool()
#     conn = None
#     try:
#         conn = p.getconn()
#         with conn.cursor() as cur:
#             cur.execute("""
#                 INSERT INTO app_state (key, value, updated_at)
#                 VALUES (%s, %s, NOW())
#                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
#             """, (key, value))
#         conn.commit()
#     finally:
#         if conn is not None:
#             p.putconn(conn)