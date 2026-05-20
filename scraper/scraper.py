from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date

DB = psycopg2.connect("postgresql://localhost/jobtrends")

def save(posting):
    with DB.cursor() as cur:
        cur.execute("""
            INSERT INTO postings (title, company, location, date_scraped)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (posting['title'], posting['company'], posting['location'], date.today()))
    DB.commit()