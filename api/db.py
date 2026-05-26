import psycopg2
import os
from dotenv import load_dotenv
from psycopg2 import pool

load_dotenv()

pool = psycopg2.pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=os.environ["DATABASE_URL"]
)

def query(sql, params=None):
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        pool.putconn(conn)