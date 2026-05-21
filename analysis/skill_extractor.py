from dotenv import load_dotenv
import os

load_dotenv()

DB = psycopg2.connect(os.environ["DATABASE_URL"])