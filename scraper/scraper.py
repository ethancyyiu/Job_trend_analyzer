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
            posting['description'], date.today(), posting.get('date_posted'), posting.get('salary_min'),
            posting.get('salary_max'), posting.get('salary_type')
        ))
    db.commit()
    print(f"  saved: {posting['title']} @ {posting['company']}")

def scrape(keyword="software engineer", location="Remote", pages=3):
    db = get_db()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

        context = browser.new_context(user_agent=AGENT)
        page = context.new_page()

        for i in range(pages):
            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={keyword}&location={location}&start={i * 25}"
            )
            print(f"\n--- Loading page {i+1} ---")
            page.goto(url, timeout=60000)
            page.wait_for_timeout(3000)

            page.wait_for_timeout(3000)

            # collect all job URLs and basic info from the listing page first
            cards = page.query_selector_all("div.base-card")
            print(f"Page {i+1}: found {len(cards)} cards")

            job_links = []
            for card in cards:
                link_el     = card.query_selector("a.base-card__full-link")
                company_el  = card.query_selector(".base-search-card__subtitle")
                location_el = card.query_selector(".job-search-card__location")

                if not link_el or not company_el or not location_el:
                    print("  Missing field on card — skipping")
                    continue

                href = link_el.get_attribute("href").split("?")[0]
                company  = company_el.inner_text().strip()
                location = location_el.inner_text().strip()
                job_links.append((href, company, location))

            print(f"  Collected {len(job_links)} valid job links")

            # now visit each job page individually
            for href, company, location in job_links:
                print(f"  Visiting: {href}")
                page.goto(href, timeout=30000)
                page.wait_for_timeout(random.randint(2000, 3500))

                # title
                title_el = (
                    page.query_selector("h1.top-card-layout__title") or
                    page.query_selector("h1.t-24") or
                    page.query_selector("h1")
                )
                title = title_el.inner_text().strip() if title_el else ""

                # date posted
                posted_el = (
                    page.query_selector("span.posted-time-ago__text") or
                    page.query_selector("span.job-search-card__listdate") or
                    page.query_selector("time") or
                    page.query_selector("span:has-text('ago')")
                )
                posted_text = posted_el.inner_text().strip() if posted_el else ""
                match = re.search(r'(\d+\s+(?:hour|minute|day|week|month|year)s?\s+ago)', posted_text.lower())
                date_posted = parse_date(match.group(1)) if match else None
                print(f"    date_posted: {date_posted} (raw: '{posted_text}')")

                # description
                desc_el = (
                    page.query_selector(".show-more-less-html__markup") or
                    page.query_selector(".description__text") or
                    page.query_selector(".jobs-description__content")
                )
                description = desc_el.inner_text().strip() if desc_el else ""
                print(f"    description length: {len(description)} chars")
                page.wait_for_timeout(random.randint(2000, 3500))
                
                salary_el = page.query_selector(".jobs-unified-top-card__job-insight span") or page.query_selector("span:has-text('$')")
                if salary_el:
                    salary_text = salary_el.inner_text().strip()
                else:
                    salary_text = ""
                    
                if salary_text:
                    salary_min, salary_max, salary_type = extract_salary(salary_text)
                else:
                    salary_min, salary_max, salary_type = None, None, None
                
                page.wait_for_timeout(random.randint(2000, 3500))
                print(f"salary_text: {salary_text}")
                print(f"min: {salary_min}, max: {salary_max}, type:{salary_type}")

                if not title:
                    print("    No title found — skipping")
                    continue

                save(db, {
                    "title":       title,
                    "company":     company,
                    "location":    location,
                    "description": description,
                    "date_posted": date_posted,
                    "salary_min":  salary_min,
                    "salary_max":  salary_max,
                    "salary_type": salary_type, 
                })

                time.sleep(random.uniform(2, 5))

            time.sleep(random.uniform(10, 20))

        browser.close()
        db.close()
        print("\nScrape complete.")

if __name__ == "__main__":
    scrape()
    run()