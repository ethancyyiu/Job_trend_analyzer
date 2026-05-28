from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date
import time
import os
import json
import tempfile
from dotenv import load_dotenv
import random
from analysis.date_parser import parse_date
from api.db import get_state, set_state
import re
import logging

load_dotenv()
log = logging.getLogger(__name__)

DB_URL = os.environ["DATABASE_URL"]

def get_db():
    return psycopg2.connect(DB_URL)

def save(posting):
    db = get_db()
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO postings (title, company, location, description, date_scraped, date_posted)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            posting['title'], posting['company'], posting['location'],
            posting['description'], date.today(), posting.get('date_posted')
        ))
    db.commit()
    db.close()

def load_session_to_file():
    """Load session from DB into a temp file Playwright can read."""
    session_json = get_state("linkedin_session")
    if not session_json:
        return None
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    tmp.write(session_json)
    tmp.close()
    return tmp.name

def save_session_from_file(path):
    """Read session file and persist it to DB."""
    with open(path, 'r') as f:
        set_state("linkedin_session", f.read())

def scrape(keyword="software engineer", location="Remote", pages=3):
    session_file = load_session_to_file()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless = False)  
        AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

        context = browser.new_context(
            user_agent=AGENT,
            storage_state=session_file if session_file else None
        )
        page = context.new_page()

        # Try to use existing session first
        page.goto("https://www.linkedin.com/feed/", timeout=30000)
        print("feed")
        page.wait_for_timeout(5000)

        # If we're not on the feed, we need to log in
        # Check for authenticated elements (profile menu) instead of just URL
        is_authenticated = page.query_selector("[data-test-id='profile-menu-trigger']") is not None
        
        if not is_authenticated:
            log.info("Session expired or missing — logging in...")
            print("not logged in")
            page.goto("https://www.linkedin.com/login")
            # page.wait_for_selector("input[name='session_key']", timeout=10000)
            page.fill("input[type='email']", os.environ["LI_EMAIL"])
            page.fill("input[autocomplete='current-password']", os.environ["LI_PASSWORD"])

            page.click("button[type=submit]")

            try:
                page.wait_for_url("**/feed/**", timeout=20000)
            except Exception:
                log.error("Login failed — may need manual intervention or captcha")
                browser.close()
                return

        # Save the fresh session back to DB
        tmp_out = tempfile.NamedTemporaryFile(suffix='.json', delete=False)
        tmp_out.close()
        context.storage_state(path=tmp_out.name)
        save_session_from_file(tmp_out.name)
        print("save")
        log.info("Session saved to database.")

        # Scrape pages
        for i in range(pages):
            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={keyword}&location={location}&start={i * 25}"
            )
            page.goto(url, timeout=60000)

            try:
                page.wait_for_selector("div.job-card-container", timeout=10000)
            except Exception:
                log.warning(f"No job cards found on page {i+1}, skipping")
                continue

            for _ in range(10):
                page.evaluate("""
                    (() => {
                        const all = document.querySelectorAll('*');
                        for (const el of all) {
                            const style = getComputedStyle(el);
                            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                                el.scrollHeight > el.clientHeight + 50) {
                                el.scrollBy(0, 500);
                                return;
                            }
                        }
                    })();
                """)
                page.wait_for_timeout(random.randint(500, 1200))

            page.wait_for_timeout(5000)
            cards = page.query_selector_all("div.job-card-container")
            log.info(f"Page {i+1}: found {len(cards)} cards")

            for card in cards:
                title_el    = card.query_selector(".job-card-list__title--link")
                company_el  = card.query_selector(".artdeco-entity-lockup__subtitle")
                location_el = card.query_selector(".artdeco-entity-lockup__caption")

                if not title_el or not company_el or not location_el:
                    continue

                card.click()
                page.wait_for_timeout(random.randint(1500, 3000))

                posted_el = (
                    page.query_selector(".jobs-unified-top-card__posted-date")
                    or page.query_selector("span:has-text('ago')")
                )
                posted_text = posted_el.inner_text().strip() if posted_el else ""
                match = re.search(r'(\d+\s+(?:hour|minute|day|week|month|year)s?\s+ago)', posted_text.lower())
                date_posted = parse_date(match.group(1)) if match else None

                desc_el = page.query_selector(".jobs-description__content")
                description = desc_el.inner_text().strip() if desc_el else ""

                save({
                    "title":       title_el.inner_text().strip(),
                    "company":     company_el.inner_text().strip(),
                    "location":    location_el.inner_text().strip(),
                    "description": description,
                    "date_posted": date_posted,
                })

            time.sleep(random.uniform(10, 20))

        browser.close()
        log.info("Scrape complete.")

if __name__ == "__main__":
    scrape()