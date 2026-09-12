import os
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import Json
from analysis.predictions import build_forecast

load_dotenv()


def generate_and_save_forecast():
    """Persist the prediction after the daily scrape so API reads stay fast."""
    print("Generating daily forecast...")
    payload = build_forecast()
    db_url = os.environ["DATABASE_URL"]
    db = psycopg2.connect(db_url)
    try:
        with db.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS forecast_cache (
                    cache_key TEXT PRIMARY KEY,
                    payload JSONB NOT NULL,
                    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                INSERT INTO forecast_cache (cache_key, payload, generated_at)
                VALUES ('daily_trends', %s, NOW())
                ON CONFLICT (cache_key) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    generated_at = EXCLUDED.generated_at
            """, (Json(payload),))
        db.commit()
        print("Daily forecast saved.")
    finally:
        db.close()


if __name__ == "__main__":
    generate_and_save_forecast()
