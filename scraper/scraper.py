from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date
import time
import os
from dotenv import load_dotenv
import random
from analysis.date_parser import parse_date
import re
import logging
from analysis.salary_extractor import extract_salary
from analysis.skill_extractor import extract_skills, run

load_dotenv()
log = logging.getLogger(__name__)

DB_URL = os.environ["DATABASE_URL"]

def get_db():
    return psycopg2.connect(DB_URL)

def save(db, posting):
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO postings (title, company, location, description, date_scraped, date_posted, salary_min, salary_max, salary_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            posting['title'], posting['company'], posting['location'],
            posting['description'], date.today(), posting.get('date_posted'),
            posting.get('salary_min'), posting.get('salary_max'), posting.get('salary_type')
        ))
    db.commit()
    print(f"  saved: {posting['title']} @ {posting['company']}\n")

def scrape(keyword, location, pages, batch_number):
    db = get_db()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless = True)
        AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        context = browser.new_context(user_agent=AGENT)
        page = context.new_page()

        for page_num in range(pages):
            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={keyword}&location={location}&start={page_num * 25}"
            )
            print(f"\n--- Loading page {page_num + 1} ---")
            page.goto(url, timeout=30000)
            page.wait_for_timeout(6000)
            
            # close login page 
            print("escaping from login")
            page.keyboard.press("Escape")
            page.wait_for_timeout(random.randint(3500, 4000))

            cards = page.query_selector_all("a.base-card__full-link")
            print(f"  Found {len(cards)} job cards")

            for card in cards:
                try:
                    card.click()
                    page.wait_for_timeout(random.randint(3500, 4000))
                    # input("enter")
                    
                    print("escaping from login")
                    page.keyboard.press("Escape")

                    title_el = page.query_selector("h2.top-card-layout__title")
                    company_el = page.query_selector(".topcard__org-name-link")
                    location_el = page.query_selector(".topcard__flavor--bullet")
                    location_el = page.query_selector(".topcard__flavor--bullet")

                    title = title_el.inner_text().strip() if title_el else None
                    company = company_el.inner_text().strip() if company_el else None
                    location = location_el.inner_text().strip() if location_el else None
                    
                    
                    posted_el = page.query_selector(".jobs-unified-top-card__posted-date") \
                        or page.query_selector(".posted-time-ago__text")
                    # page.query_selector("span:has-text('ago')") 
                    posted_text = posted_el.inner_text().strip() if posted_el else ""
                    match = re.search(r'(\d+\s+(?:hour|minute|day|week|month|year)s?\s+ago)', posted_text.lower())
                    date_posted = parse_date(match.group(1)) if match else None
                    print(f"    date_posted: {date_posted} (raw: '{posted_text}')")
                    print(f"location: {location}")


                    desc_el = (
                        page.query_selector(".jobs-description__content .jobs-description-content__text") or
                        page.query_selector(".jobs-description__content") or
                        page.query_selector(".show-more-less-html__markup")
                    )
                    description = desc_el.inner_text().strip() if desc_el else ""
                    print(f"    description: {len(description)} chars")

                    if not title or not company:
                        print("    Missing title or company — skipping")
                        continue
                    
                    if description:
                            salary_min, salary_max, salary_type = extract_salary(description)
                    else :
                           salary_min, salary_max, salary_type = None, None, None
                           
                    print(f"min={salary_min}, max={salary_max}, type={salary_type}")

                    save(db, {
                        "title":    title,
                        "company":  company,
                        "location": location,
                        "description": description,
                        "date_posted": date_posted,
                        "salary_min":  salary_min,
                        "salary_max":  salary_max,
                        "salary_type": salary_type,
                    })
                    
                    print(f"on page: {batch_number}")

                    time.sleep(random.uniform(0.2, 0.5))

                except Exception as e:
                    print(f"    Error on card: {e}")
                    continue
            
            batch_number += 1
            time.sleep(random.uniform(2, 4))

        browser.close()
        db.close()
        print("\nScrape complete.")


if __name__ == "__main__":
    scrape("data scientist", "remote", 2, 1)
    scrape("data scientist", "canada", 1, 3)

    scrape("software engineer", "remote", 2, 4)
    scrape("software engineer", "canada", 1, 6)

    scrape("data engineer", "remote", 2, 7)
    scrape("data engineer", "canada", 1, 9)

    scrape("machine learning engineer", "remote", 2, 10)
    scrape("machine learning engineer", "canada", 1, 12)

    run()