import re

def extract_salary(text):
    if not text:
        return None, None, None  # min, max, type
    
    pattern = r'[$£€][\d,]+(?:\.\d+)?(?:\s*/\s*(?:yr|hour|hr))?'
    matches = re.findall(pattern, text.lower())

    def parse(s):
        return float(re.sub(r'[^\d.]', '', s))

    def get_type(s):
        s = s.lower()
        print(s)

        if re.search(r'\b(per\s*year|yearly|/yr|yr|year)\b', s):
            return 'yearly'

        if re.search(r'\b(per\s*hour|hourly|/hr|hr|hour)\b', s):
            return 'hourly'

        numbers = re.findall(r'\d+', s)
        if numbers:
            # any number >= 10000 
            if any(int(n) >= 10000 for n in numbers):
                return 'yearly'
            return 'hourly'

        return None


    
    def usd(value, s):
        s = s.strip()
        if s.startswith('£'):
            return int(value * 1.35)
        if s.startswith('€'):
            return int(value * 1.17)
        return value

    # Range case
    if len(matches) >= 2:
        sal_type = get_type(matches[0]) or get_type(matches[1])

        low_raw, high_raw = parse(matches[0]), parse(matches[1])
        low = usd(low_raw, matches[0])
        high = usd(high_raw, matches[1])
        
        if sal_type is None:
            sal_type = 'yearly' if low > 1000 else 'hourly'
        
        return low, high, sal_type

    # Single value case
    elif len(matches) == 1:
        s = matches[0]
        sal_type = get_type(s)

        val_raw = parse(s)
        val = usd(val_raw, s)
        
        if sal_type is None:
            sal_type = 'yearly' if val > 1000 else 'hourly'

        return val, None, sal_type

    return None, None, None
