from playwright.sync_api import sync_playwright
import psycopg2
from datetime import date

DB = psycopg2.connect("postgresql://localhost/jobtrends")

