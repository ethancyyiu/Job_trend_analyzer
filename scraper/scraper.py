from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date
import time
import os
from dotenv import load_dotenv

load_dotenv() 

DB = psycopg2.connect(os.environ["DATABASE_URL"])

def save(posting):
    with DB.cursor() as cur:
        cur.execute("""
            INSERT INTO postings (title, company, location, date_scraped)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (posting['title'], posting['company'], posting['location'], date.today()))
    DB.commit()

def scrape(keyword="software engineer", location="Remote", pages=5):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        for i in range(pages):
            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={keyword}&location={location}&start={i * 25}"
            )
            page.goto(url)
            page.wait_for_timeout(3000)  # let JS render

            cards = page.query_selector_all(".job-search-card")
            for card in cards:
                try:
                    save({
                        "title":    card.query_selector(".base-search-card__title").inner_text().strip(),
                        "company":  card.query_selector(".base-search-card__subtitle").inner_text().strip(),
                        "location": card.query_selector(".job-search-card__location").inner_text().strip(),
                    })
                except:
                    continue

            time.sleep(2)  # be polite

        browser.close()

if __name__ == "__main__":
    scrape()