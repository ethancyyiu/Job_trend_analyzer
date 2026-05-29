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

        cleaned = re.sub(r'[$£€,]', '', s)

        numbers = re.findall(r'\d+(?:\.\d+)?', cleaned)
        if not numbers:
            return None

        value = float(numbers[0])

        if value >= 5000:
            return 'yearly'
        return 'hourly'



    
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
