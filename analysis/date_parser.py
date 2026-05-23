from datetime import date, timedelta

def parse_date(text):
    text = text.lower().replace("reposted", "").strip()
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
    if "year" in text:
        answer = int(''.join(filter(str.isdigit, text)) or 1)
        return today - timedelta(days = answer * 365)
    return None