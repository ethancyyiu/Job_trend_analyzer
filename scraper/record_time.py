import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def record_successful_scrape():
    """Save the completion time only after the full scraper pipeline succeeds."""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    with psycopg2.connect(database_url) as db:
        with db.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS scrape_runs (
                    id BIGSERIAL PRIMARY KEY,
                    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("INSERT INTO scrape_runs DEFAULT VALUES")
