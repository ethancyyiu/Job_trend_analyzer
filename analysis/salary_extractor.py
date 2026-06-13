import re
from analysis.gemini_extractor import gemini_extract

def extract_salary(text):
    if not text:
        return None, None, None

    pattern = r'[$£€₹¥][\d,]+(?:\.\d+)?[kK]?(?:\s*/\s*(?:yr|year|annual|hour|hr|h))?'
    matches = re.findall(pattern, text.lower())

    def parse(s):
        s = re.sub(r'[$£€¥₹,]', '', s.strip())
        m = re.match(r'([\d.]+)([kK]?)', s)
        if not m:
            return None
        value = float(m.group(1))
        if m.group(2).lower() == 'k':
            value *= 1000
        return value

    def get_type(s, parsed_value = None):
        s = s.lower()
        if re.search(r'/\s*(?:yr|year|annual)', s):
            return 'yearly'
        if re.search(r'/\s*(?:hr|hour|h)\b', s):
            return 'hourly'
        # use parsed value
        value = parsed_value if parsed_value is not None else 0
        return 'yearly' if value >= 35000 else 'hourly'

    def usd(value, s):
        s = s.strip()
        if s.startswith('£'):
            return int(value * 1.35)
        if s.startswith('€'):
            return int(value * 1.17)
        if s.startswith('₹'):
            return int(value * 0.01)
        if s.startswith('¥'):
            return int(value * 0.0062)
        return int(value)

    if len(matches) >= 2:
        low_raw = parse(matches[0])
        high_raw = parse(matches[1])
        sal_type = get_type(matches[0], low_raw) or get_type(matches[1], high_raw)
            
        if sal_type == 'hourly':
            data = gemini_extract(text)
            return data["salary_min"], data["salary_max"], data["salary_type"]
        
        low = usd(low_raw, matches[0])
        high = usd(high_raw, matches[1])
        if sal_type is None:
            sal_type = 'yearly' if low > 35000 else 'hourly'
        
        return low, high, sal_type

    elif len(matches) == 1:
        s = matches[0]
        val_raw = parse(s)
        sal_type = get_type(s, val_raw)
        
        if sal_type == 'hourly':
            data = gemini_extract(text)
            return data["salary_min"], data["salary_max"], data["salary_type"]
        
        val = usd(val_raw, s)
        if sal_type is None:
            sal_type = 'yearly' if val > 35000 else 'hourly'
        return val, val, sal_type

    return None, None, None