import re

def extract_salary(text):
    if not text:
        return None, None, None  # min, max, type
    
    pattern = r'\$[\d,]+(?:\.\d+)?(?:\s*/\s*(?:yr|hour|hr))?'
    matches = re.findall(pattern, text.lower())

    def parse(s):
        return float(re.sub(r'[^\d.]', '', s))

    def get_type(s):
        if 'hr' in s or 'hour' in s:
            return 'hourly'
        if 'yr' in s:
            return 'yearly'
        return None

    if len(matches) >= 2:
        sal_type = get_type(matches[0]) or get_type(matches[1])
        low, high = parse(matches[0]), parse(matches[1])
        
        if sal_type is None:
            if low > 1000:
                sal_type = 'yearly' 
            else:
                'hourly'
        
        return low, high, sal_type

    elif len(matches) == 1:
        sal_type = get_type(matches[0])
        val = parse(matches[0])
        if sal_type is None:
            if val > 1000:
                sal_type = 'yearly'
            else:
                'hourly'
        return val, None, sal_type

    return None, None, None