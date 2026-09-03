import psycopg2
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ["DATABASE_URL"]

def load_posting_data():
    conn = psycopg2.connect(DB_URL)
    
    query = """
    SELECT 
        DATE(date_posted) as posting_date,
        COUNT(*) as posting_count
    FROM postings
    WHERE date_posted >= now() - interval '90 days'
    GROUP BY DATE(date_posted)
    ORDER BY posting_date ASC
    """
    
    df = pd.read_sql(query, conn)
    conn.close()
    
    return df

df = load_posting_data()
