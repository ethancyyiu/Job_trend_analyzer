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
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
        page = context.new_page()

        page.goto("https://www.linkedin.com/login")
        if page.locator("#username").count() > 0:
            print("Logging in...")
            page.fill("#username", os.environ["LI_EMAIL"])
            page.fill("#password", os.environ["LI_PASSWORD"])
            page.click("button[type=submit]")
            page.wait_for_timeout(2000)
        else:
            print("Already logged in, skipping login")

        for i in range(pages):
            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={keyword}&location={location}&start={i * 25}"
            )
            page.goto(url, timeout = 60000)
            page.wait_for_selector("div[data-job-id]", timeout=10000)  
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)") 
            page.wait_for_timeout(2000)  

            page.wait_for_selector("div[data-job-id]", timeout=20000)

            cards = page.query_selector_all("div[data-job-id]")
            print(f"Page {i+1}: found {len(cards)} cards")
            for card in cards:
                try:
                    save({
                        "title":    card.query_selector(".job-card-list__title").inner_text().strip(),
                        "company":  card.query_selector(".job-card-container__company-name").inner_text().strip(),
                        "location": card.query_selector(".job-card-container__metadata-item").inner_text().strip(),
                    })
                except:
                    continue

            time.sleep(3)  

        browser.close()

if __name__ == "__main__":
    scrape()