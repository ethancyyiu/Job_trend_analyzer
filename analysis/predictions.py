"""Build the dashboard forecast payload used by the scraper and API."""

from analysis.forecast import (
    calculate_forecast,
    forecast_next_days,
    load_data,
    prepare_data,
    train_model,
)

JOB_CATEGORIES = [
    "software engineer",
    "data engineer",
    "machine learning engineer",
    "data scientist",
    "data analyst",
    "others",
]


def _records(frame):
    """Return JSON-safe forecast records (PostgreSQL can store these as JSONB)."""
    records = frame.to_dict("records")
    for record in records:
        record["ds"] = record["ds"].strftime("%Y-%m-%d")
    return records


def build_forecast():
    """Train all series once and return the API response payload."""
    df = load_data()
    prophet_data = prepare_data(df)
    latest_date = df["posting_date"].max()
    forecast = forecast_next_days(train_model(prophet_data), days_ahead=7)

    category_forecasts = {}
    for category in JOB_CATEGORIES:
        category_rows = load_data(category)
        if len(category_rows) < 2:
            category_forecasts[category] = []
            continue

        category_data = prepare_data(
            category_rows, end_date=latest_date, fill_missing_with_zero=True
        )
        category_forecasts[category] = _records(
            forecast_next_days(train_model(category_data), days_ahead=7)
        )

    return {
        "forecast": _records(forecast),
        "category_forecasts": category_forecasts,
        "summary": calculate_forecast(prophet_data, forecast),
    }
