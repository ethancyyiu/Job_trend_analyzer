import psycopg2
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ["DATABASE_URL"]

def load_data():
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

df = load_data()

def prepare_data(df):
    # because prophet only takes 2 columns, we need to prepare it with the date, and the value to forecast   
    prophet_df = df.copy()
    prophet_df['ds'] = pd.to_datetime(prophet_df['posting_date'])
    prophet_df['y'] = prophet_df['posting_count']
    
    prophet_df = prophet_df[['ds', 'y']].sort_values('ds')
    
    prophet_df = prophet_df.set_index('ds').asfreq('D').interpolate().reset_index()
    return prophet_df

prophet_data = prepare_data(df)

from prophet import Prophet

def train_model(df):
    model = Prophet(
        interval_width= 0.95,  
        yearly_seasonality = False,  
        weekly_seasonality = True,  
        daily_seasonality = False,  
    )
    
    # this can help with sudden movement if I know when a posting spike might be
    # model.add_seasonality(name='september_spike', period=365, fourier_order=5)
    
    print("training")
    model.fit(df)
    print("trained")
    
    return model

model = train_model(prophet_data)
