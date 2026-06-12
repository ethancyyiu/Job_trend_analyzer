from google import genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def gemini_extract(description):
    prompt = f"""
        You are a precise salary extraction engine. Read the job posting text and extract salary information exactly as stated. Follow these rules exactly and output ONLY valid JSON with no extra text.

Rules
1. Identify salary mentions and determine one of three outcomes for salary_type:
   - "hourly" if the posting explicitly states an hourly rate.
   - "yearly" if the posting explicitly states an annual salary, or if the posting states weekly or monthly pay that you convert to annual using the conversion rules below.
   - null if there is no explicit salary information.

2. Conversions
   - If salary is given as weekly, convert to yearly by multiplying weekly by 4.333 then by 12 (equivalent to ~52 weeks). After conversion, set salary_type to "yearly".
   - If salary is given as monthly, convert to yearly by multiplying monthly by 12. After conversion, set salary_type to "yearly".
   - Do not convert hourly values to yearly. If the posting gives hourly, keep salary_type "hourly" and return hourly numeric values.

3. Numeric output rules
   - Return **numbers only** for salary_min and salary_max (no currency symbols, no commas).
   - If the posting gives a single salary value (not a range), set both salary_min and salary_max to that same numeric value.
   - If the posting gives a range, extract the numeric minimum and maximum.
   - If the posting gives multiple different salary lines, extract the primary salary mentioned for the role described in the posting. 
   - If no salary information is present, set salary_type, salary_min, and salary_max to null.

4. Precision and rounding
   - For conversions, round to the nearest whole number.

5. Raw text
   - Include the exact substring from the posting that contains the salary information in the field raw_text. If multiple salary substrings are present, include the one you used to compute the values.

6. Output format
   - Output ONLY valid JSON that exactly matches this schema and nothing else.

    JSON schema:
    {{
        "salary_min": number | null,
        "salary_max": number | null,
        "salary_type": "hourly" | "yearly" | null,
        "raw_text": string | null
    }}

    Now extract salary information from the job posting: {description}

    """
        
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=prompt,
        temperature=0.0
    )
    
    result = response.text()
    data = json.loads(response)
    
    salary_min = data["salary_min"]
    salary_max = data["salary_max"]
    salary_type = data["salary_type"]
    raw_text = data["raw_text"]
    
    return {"salary_min": salary_min,
            "salary_max": salary_max,
            "salary_type": salary_type,
            "raw_text": raw_text}


