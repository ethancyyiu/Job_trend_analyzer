import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB = psycopg2.connect(os.environ["DATABASE_URL"])

def query(sql, params=None):
    with DB.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()