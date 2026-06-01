import re

def extract_salary(text):
    print(text)
    input("enter")
    if not text:
        return None, None, None  # min, max, type
    
    pattern = r'[$£€][\d,]+(?:\.\d+)?[kK]?(?:\s*/\s*(?:yr|year|annual|hour|hr|h))?'
    matches = re.findall(pattern, text.lower())

    def parse(s):
        s = re.sub(r'[$£€,]', '', s.strip())
    
        m = re.match(r'([\d.]+)([kK]?)', s)
        if not m:
            return None

        value = float(m.group(1))
        if m.group(2).lower() == 'k':
            value *= 1000
        return value

    def get_type(s):
        s = s.lower()
        if re.search(r'/\s*(?:yr|year|annual)', s):
            return 'yearly'
        
        if re.search(r'/\s*(?:hr|hour|h)\b', s):
            return 'hourly'
        
        numbers = re.findall(r'\d+(?:\.\d+)?', re.sub(r'[$£€,]', '', s))
        if not numbers:
            return None
        return 'yearly' if float(numbers[0]) >= 5000 else 'hourly'

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
