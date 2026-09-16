import os
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import Json
from analysis.predictions import build_forecast

load_dotenv()

# save the forecast and not overwrite it for backtesting
def generate_and_save_forecast():
    print("Generating daily forecast...")
    payload = build_forecast()
    db_url = os.environ["DATABASE_URL"]
    db = psycopg2.connect(db_url)
    try:
        with db.cursor() as cur:
            cur.execute("""
                INSERT INTO forecast_cache (cache_key, payload, generated_at)
                VALUES ('daily_trends', %s, NOW())
            """, (Json(payload),))
        db.commit()
        print("Daily forecast snapshot saved.")
    finally:
        db.close()


if __name__ == "__main__":
    generate_and_save_forecast()
