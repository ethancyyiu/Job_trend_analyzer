from prophet import Prophet
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
    WHERE date_posted >= now() - interval '95 days'
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
# print(prophet_data.head(10))

def train_model(df):
    model = Prophet(
        interval_width= 0.95,  
        yearly_seasonality = False,  
        weekly_seasonality = True,  
        daily_seasonality = False,  
    )
    
    # this can help with sudden movement if I know when a posting spike might be
    # model.add_seasonality(name='september_spike', period=365, fourier_order=5)
    
    # print("training")
    model.fit(df)
    # print("done")
    
    return model

model = train_model(prophet_data)

def forecast_next_days(model, days_ahead):
    # creates the dates for the model to fill in
    future = model.make_future_dataframe(periods=days_ahead)
    
    forecast = model.predict(future)
    
    # date, value, upper and lower bounds
    forecast_output = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days_ahead)
    
    return forecast_output

forecast = forecast_next_days(model, days_ahead = 7)
# print(forecast)

def calculate_forecast(historical_df, forecast_df):
    # most recent real value
    latest_actual = historical_df['y'].iloc[-1]
    
    # average of the forecast
    forecast_avg = forecast_df['yhat'].mean()
    
    if forecast_avg > latest_actual:
        direction = "Up" 
    else: 
        "Down"
    
    change = ((forecast_avg - latest_actual) / latest_actual) * 100
    
    if change > 10:
        trend_signal = "Accelerating"
    elif change > 0:
        trend_signal = "Growing"
    elif change > -10:
        trend_signal = "Declining"
    else:
        trend_signal = "Cooling"
        
    if forecast_df['yhat_upper'].mean() - forecast_df['yhat_lower'].mean() < 30:
        confidence = "high"
    else:
        confidence = "Medium"
        
    # print(forecast_df['yhat_upper'].mean() - forecast_df['yhat_lower'].mean())
    
    return {
    "latest": int(latest_actual),
    "forecast_avg": float(round(forecast_avg)),
    "direction": direction,
    "percent_change": float(round(change, 1)),
    "trend": trend_signal,
    "confidence": "High" if float(forecast_df['yhat_upper'].mean() - forecast_df['yhat_lower'].mean()) < 30 else "Medium"
}


insights = calculate_forecast(prophet_data, forecast)
print(insights)