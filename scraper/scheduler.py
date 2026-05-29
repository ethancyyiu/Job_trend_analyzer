from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from scraper.scraper import scrape
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

scheduler = BlockingScheduler()

@scheduler.scheduled_job(IntervalTrigger(days=3))
def weekly_scrape():
    log.info("Starting weekly scrape...")
    scrape(keyword = "software engineer", location = "Remote", pages = 2)
    scrape(keyword = "data engineer", location = "Remote", pages = 2)
    log.info("Weekly scrape complete.")

if __name__ == "__main__":
    log.info("Scheduler started. Waiting for next run...")
    scheduler.start()