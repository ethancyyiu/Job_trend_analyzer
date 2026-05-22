from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date
import time
import os
from dotenv import load_dotenv
import random

load_dotenv() 

DB = psycopg2.connect(os.environ["DATABASE_URL"])

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
]

def save(posting):
    with DB.cursor() as cur:
        cur.execute("""
            INSERT INTO postings (title, company, location, description, date_scraped)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (posting['title'], posting['company'], posting['location'], posting['description'], date.today()))
    DB.commit()

def scrape(keyword = "software engineer", location = "Remote", pages = 5):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent=random.choice(USER_AGENTS), 
            storage_state = "session.json" if os.path.exists("session.json") else None
        )
        page = context.new_page()

        page.goto("https://www.linkedin.com/login")
         
        page.wait_for_timeout(6000)
        print("Current URL:", page.url) 

        if page.url == "https://www.linkedin.com/login" or "login" in page.url:
            print("Logging in...")
            # page.wait_for_selector("#username", timeout=10000)
            page.fill("input[name='session_key']", os.environ["LI_EMAIL"])
            page.fill("input[name='session_password']", os.environ["LI_PASSWORD"])
            page.click("button[type=submit]")
            page.wait_for_url("**/feed/**", timeout=15000) 
            context.storage_state(path = "session.json")
        else:
            print("Already logged in, skipping login")

        # page.goto("https://www.linkedin.com/jobs/")
        # page.wait_for_timeout(3000)
        # print("Jobs URL:", page.url)

        for i in range(pages):
            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={keyword}&location={location}&start={i * 25}"
            )
            page.goto(url, timeout = 60000)
            page.wait_for_selector("div.job-card-container", timeout = 10000) 
            
            for _ in range(10):
                page.evaluate("window.scrollBy(0, 2000)")
                page.wait_for_timeout(800)

            page.wait_for_timeout(5000)

            cards = page.query_selector_all("div.job-card-container")
            print(f"Page {i+1}: found {len(cards)} cards")
            for card in cards:
                title_el    = card.query_selector(".job-card-list__title--link")
                company_el  = card.query_selector(".artdeco-entity-lockup__subtitle")
                location_el = card.query_selector(".artdeco-entity-lockup__caption")

                if not title_el or not company_el or not location_el:
                    print("Missing field — skipping")
                    continue

                card.click()
                page.wait_for_timeout(random.randint(1500, 3000))

                desc_el = page.query_selector(".jobs-description__content")
                description = desc_el.inner_text().strip() if desc_el else ""

                save({
                    "title":    title_el.inner_text().strip(),
                    "company":  company_el.inner_text().strip(),
                    "location": location_el.inner_text().strip(),
                    "description" : description,
                })
                # print(card.inner_html()[:500])
                # print(card.inner_html()[:2000])
                # break

            time.sleep(random.uniform(4, 8)) 

        browser.close()

if __name__ == "__main__":
    scrape()