from google import genai
import os
from dotenv import load_dotenv
import json
import psycopg2
import time

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def gemini_extract(description):
    print("CALLED GEMINI API!!!!!!!")
    prompt = f"""
        You are a precise salary extraction engine. Read the job posting text and extract salary information exactly as stated. Follow these rules exactly and output ONLY valid JSON with no extra text.

Rules
1. Identify salary mentions and determine one of three outcomes for salary_type:
   - "hourly" if the posting explicitly states an hourly rate.
   - "yearly" if the posting explicitly states an annual salary, or if the posting states weekly or monthly pay that you convert to annual using the conversion rules below.
   - null if there is no explicit salary information.
   
2. Currency detection and conversion to USD
   - Detect the currency symbol in the salary text.
   - Convert ALL salary values to USD using these exact fixed multipliers:

       * GBP (£) → USD: multiply by 1.34
       * EUR (€) → USD: multiply by 1.16
       * INR (₹) → USD: multiply by 0.011
       * JPY (¥) → USD: multiply by 0.0062

       * CAD (C$, CA$, $CAD) → USD: multiply by 0.71
       * AUD (A$, $AUD) → USD: multiply by 0.70
       * SGD (S$, $SGD) → USD: multiply by 0.78
       * CHF (CHF) → USD: multiply by 1.25
       * HKD (HK$) → USD: multiply by 0.13

       * If currency is already USD ($), keep as-is.
       * If currency is unknown, assume USD.

   - Apply currency conversion BEFORE converting weekly/monthly/daily → yearly.

3. Conversions
   - If salary is given as weekly, convert to yearly by multiplying weekly by 52. After conversion, set salary_type to "yearly".
   - If salary is given as monthly, convert to yearly by multiplying monthly by 12. After conversion, set salary_type to "yearly".
   - If salary is given as daily, convert to yearly by multiplying daily by 220. After conversion, set salary_type to "yearly".
   - Do not convert hourly values to yearly. If the posting gives hourly, keep salary_type "hourly" and return hourly numeric values.

4. Numeric output rules
   - Return **numbers only** for salary_min and salary_max (no currency symbols, no commas).
   - If the posting gives a single salary value (not a range), set both salary_min and salary_max to that same numeric value.
   - If the posting gives a range, extract the numeric minimum and maximum.
   - If the posting gives multiple different salary lines, extract the primary salary mentioned for the role described in the posting. 
   - If no salary information is present, set salary_type, salary_min, and salary_max to null.

5. Precision and rounding
   - For conversions, round to the nearest whole number.

6. Output format
   - Output ONLY valid pure (not markdown) JSON that exactly matches this schema and nothing else.

    JSON schema:
    {{
        "salary_min": number | null,
        "salary_max": number | null,
        "salary_type": "hourly" | "yearly" | null
    }}

    Now extract salary information from the job posting: {description}

    """
        
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json"
        }
    )
    
    result = response.text.strip()
    data = json.loads(result)
    
    salary_min = data["salary_min"]
    salary_max = data["salary_max"]
    salary_type = data["salary_type"]
    #raw_text = data["raw_text"]
    
    return {"salary_min": salary_min,
            "salary_max": salary_max,
            "salary_type": salary_type}
            # ,"raw_text": raw_text

# can also ask it to generate the
# 5. Raw text
#    - Include the exact substring from the posting that contains the salary information in the field raw_text. If multiple salary substrings are present, include the one you used to compute the values.
#        ,"raw_text": string | null

def run():
   DB = psycopg2.connect(os.environ["DATABASE_URL"])
   with DB.cursor() as cur:
      cur.execute("SELECT id, title, description FROM postings WHERE salary_type = 'hourly'")
      
      # for fixing particular job postings only
      # cur.execute("SELECT id, title, description FROM postings WHERE date_scraped = '2026-06-13' ORDER BY id DESC OFFSET 149 LIMIT 51")
      rows = cur.fetchall()
      print(f"Processing {len(rows)} postings...")

      count = 1
      for row_id, title, description in rows:
         # time.sleep(3)
         found = gemini_extract(description)
         salary_min = found["salary_min"]
         salary_max = found["salary_max"]
         salary_type = found["salary_type"]
         print(f"count: {count}, salary_min: {salary_min}, salary_max: {salary_max}, salary_type: {salary_type}")
         count += 1
         cur.execute(
            "UPDATE postings SET salary_min = %s, salary_max = %s, salary_type = %s WHERE id = %s",
            (salary_min, salary_max, salary_type, row_id)
         )
         DB.commit()

      print("all done!")
        
if __name__ == "__main__":
   run()