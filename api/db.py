import psycopg2
import os
from dotenv import load_dotenv
from psycopg2 import pool, OperationalError

load_dotenv()

_pool = None

def _get_pool():
    global _pool
    if _pool is None:
        dsn = os.environ.get("DATABASE_URL")
        if not dsn:
            raise RuntimeError("DATABASE_URL environment variable is not set")
        _pool = psycopg2.pool.SimpleConnectionPool(minconn=1, maxconn=10, dsn=dsn, connect_timeout=5)
    return _pool

def query(sql, params=None):
    p = _get_pool()
    conn = None
    returned_to_pool = False
    try:
        conn = p.getconn()
        
        if getattr(conn, "closed", 0):
            p.putconn(conn, close=True)
            conn = p.getconn()
            
        with conn.cursor() as cur:
            cur.execute(sql, params)
            # DDL and writes without RETURNING do not produce a result set.
            # This keeps small schema setup operations inside the pool helper.
            result = cur.fetchall() if cur.description else []
            conn.commit() 
            return result
        
    except OperationalError:
        if conn is not None:
            try:
                p.putconn(conn, close=True)
            except Exception:
                pass
            conn = None
        raise
            
    except Exception:
        if conn is not None:
            try:
                conn.rollback()
                p.putconn(conn)
                returned_to_pool = True
            except Exception:
                try:
                    p.putconn(conn, close=True)
                    returned_to_pool = True
                except Exception:
                    pass
        raise

    finally:
        if conn is not None:
            # Return the connection exactly once
            if not returned_to_pool:
                try:
                    p.putconn(conn)
                except Exception:
                    # If pool rejects it, close the connection
                    try:
                        p.putconn(conn, close=True)
                    except Exception:
                        pass
