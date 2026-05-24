from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date
import time
import os
from dotenv import load_dotenv
import random
from analysis.date_parser import parse_date
import re

load_dotenv() 

DB = psycopg2.connect(os.environ["DATABASE_URL"])

def save(posting):
    with DB.cursor() as cur:
        cur.execute("""
            INSERT INTO postings (title, company, location, description, date_scraped, date_posted)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (posting['title'], posting['company'], posting['location'], posting['description'], date.today(), posting.get('date_posted')))
    DB.commit()

def scrape(keyword = "software engineer", location = "Remote", pages = 3):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

        context = browser.new_context(
            user_agent = AGENT,  
            storage_state="session.json" if os.path.exists("session.json") else None
        )
        page = context.new_page()

        page.goto("https://www.linkedin.com/feed/")
         
        page.wait_for_timeout(12000)
        input("Click Enter when ready")
        
        context.storage_state(path="session.json")
        print("Current URL:", page.url) 

        # if "login" in page.url.lower():
        #     print("Logging in...")
        #     # page.wait_for_selector("#username", timeout=10000)
        #     page.fill("input[name='session_key']", os.environ["LI_EMAIL"])
        #     page.fill("input[name='session_password']", os.environ["LI_PASSWORD"])
        #     page.click("button[type=submit]")
        #     page.wait_for_url("**/feed/**", timeout=15000) 
        #     context.storage_state(path = "session.json")
        # else:
        #     print("Already logged in, skipping login")
        
        if "login" in page.url.lower() or "welcome" in page.url.lower():
            print("Clicking account...")
            account = page.query_selector("button[aria-label='Login as Johnny Chen']")
            if account:
                account.click()
                page.wait_for_url("**/feed/**", timeout=15000)
                context.storage_state(path="session.json")
            else:
                # fall back to full login
                print("Logging in...")
                page.fill("input[name='session_key']", os.environ["LI_EMAIL"])
                page.fill("input[name='session_password']", os.environ["LI_PASSWORD"])
                page.click("button[type=submit]")
                page.wait_for_url("**/feed/**", timeout=15000)
                context.storage_state(path="session.json")
        else:
            print("Already logged in")

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
            
            # for _ in range(10):
            #     page.evaluate("""
            #             const el = document.querySelector('[data-testid="lazy-column"]') || document.querySelector('.scaffold-layout__list');
            #         if (el) el.scrollBy(0, 500);
            #     """)
            #     page.wait_for_timeout(800)
            # for hello in range(10):
            #     page.evaluate("window.scrollBy(0, 3000)")
            #     print("scrolling")
            #     page.wait_for_timeout(800)
            for hello in range(10):
                page.evaluate("""
                    (() => {
                        const all = document.querySelectorAll('*');
                        for (const el of all) {
                            const style = getComputedStyle(el);
                            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && 
                                el.scrollHeight > el.clientHeight + 50) {el.scrollBy(0, 500);
                                return;
                            }
                        }
                    })();
                """)
                page.wait_for_timeout(random.randint(500, 1200))

            page.wait_for_timeout(5000)

            cards = page.query_selector_all("div.job-card-container")
            print(f"Page {i+1}: found {len(cards)} cards")
            for card in cards:
                title_el    = card.query_selector(".job-card-list__title--link")
                company_el  = card.query_selector(".artdeco-entity-lockup__subtitle")
                location_el = card.query_selector(".artdeco-entity-lockup__caption")
                
                # posted_el = page.query_selector(".jobs-unified-top-card__posted-date") or \
                # page.query_selector("span:has-text('ago')")
                # posted_text = posted_el.inner_text().strip() if posted_el else ""
                # print(posted_text)
                # date_posted = parse_date(posted_text)
                
                if not title_el or not company_el or not location_el:
                    print("Missing field — skipping")
                    continue

                card.click()
                page.wait_for_timeout(random.randint(1500, 3000))
                
                posted_el = page.query_selector(".jobs-unified-top-card__posted-date") or page.query_selector("span:has-text('ago')")
                
                if posted_el:
                    posted_text = posted_el.inner_text().strip()
                else:
                    posted_text = ""

                match = re.search(r'(\d+\s+(?:hour|minute|day|week|month|year)s?\s+ago)', posted_text.lower())
                
                if match:
                    date_posted = parse_date(match.group(1)) 
                else:
                    date_posted = None
                    
                print("date_posted:", date_posted)

                desc_el = page.query_selector(".jobs-description__content")
                description = desc_el.inner_text().strip() if desc_el else ""

                save({
                    "title":    title_el.inner_text().strip(),
                    "company":  company_el.inner_text().strip(),
                    "location": location_el.inner_text().strip(),
                    "description" : description,
                    "date_posted": date_posted,
                })
                # print(card.inner_html()[:500])
                # print(card.inner_html()[:2000])
                # break

            time.sleep(random.uniform(10, 20)) 

        browser.close()

if __name__ == "__main__":
    scrape()