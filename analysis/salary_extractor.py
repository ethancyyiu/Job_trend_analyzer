import re

def extract_salary(text):
    if not text:
        return None, None, None  # min, max, type
    
    pattern = r'[$£€][\d,]+(?:\.\d+)?(?:\s*/\s*(?:yr|hour|hr))?'
    matches = re.findall(pattern, text.lower())

    def parse(s):
        return float(re.sub(r'[^\d.]', '', s))

    def get_type(s):
        if 'yr' in s:
            return 'yearly'
        if 'hr' in s or 'hour' in s or s:
            return 'hourly'
        return None
    
    def usd(value, s):
        if s.startswith('£'):
            return value * 1.35
        elif s.startswith('€'):
            return value * 1.17
        else:
            return value

    if len(matches) >= 2:
        sal_type = get_type(matches[0]) or get_type(matches[1])
        low_raw, high_raw = parse(matches[0]), parse(matches[1])
        
        low = usd(low_raw, matches[0])
        high = usd(high_raw, matches[1])
        
        if sal_type is None:
            if low > 1000:
                sal_type = 'yearly' 
            else:
                'hourly'
        
        return low, high, sal_type

    elif len(matches) == 1:
        sal_type = get_type(matches[0])
        val_raw = parse(matches[0])
        val = usd(val_raw, s)
        
        if sal_type is None:
            if val > 1000:
                sal_type = 'yearly'
            else:
                'hourly'
        return val, None, sal_type

    return None, None, None