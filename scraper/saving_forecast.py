import os
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import Json
from analysis.predictions import build_forecast

load_dotenv()


def migrate_forecast_primary_key(cur):
    """One-time migration from the old one-row forecast cache."""
    cur.execute("""
        DO $$
        DECLARE primary_key_name TEXT;
        BEGIN
            SELECT conname INTO primary_key_name
            FROM pg_constraint
            WHERE conrelid = 'forecast_cache'::regclass
              AND contype = 'p'
              AND pg_get_constraintdef(oid) LIKE '%cache_key%';

            IF primary_key_name IS NOT NULL THEN
                EXECUTE format(
                    'ALTER TABLE forecast_cache DROP CONSTRAINT %I',
                    primary_key_name
                );
                ALTER TABLE forecast_cache
                ADD CONSTRAINT forecast_cache_pkey PRIMARY KEY (id);
            END IF;
        END $$;
    """)


# save the forecast and not overwrite it for backtesting
def generate_and_save_forecast():
    print("Generating daily forecast...")
    payload = build_forecast()
    db_url = os.environ["DATABASE_URL"]
    db = psycopg2.connect(db_url)
    try:
        with db.cursor() as cur:
            migrate_forecast_primary_key(cur)
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
