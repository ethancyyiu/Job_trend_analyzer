from datetime import date, timedelta

def parse_date(text):
    text = text.lower()
    today = date.today()
    
    if "hour" in text or "minute" in text:
        return today
    if "day" in text:
        answer = int(''.join(filter(str.isdigit, text)) or 1)
        return today - timedelta(days = answer)
    if "week" in text:
        answer = int(''.join(filter(str.isdigit, text)) or 1)
        return today - timedelta(weeks = answer)
    if "month" in text:
        answer = int(''.join(filter(str.isdigit, text)) or 1)
        return today - timedelta(days = answer * 30)
    return None