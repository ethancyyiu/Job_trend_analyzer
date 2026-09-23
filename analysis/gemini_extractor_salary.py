from google import genai
from google.genai.errors import ServerError
import os
from dotenv import load_dotenv
import json
import psycopg2
import time

load_dotenv()

GEMINI_CLIENTS = [
    genai.Client(api_key=api_key)
    for api_key in (
        os.getenv("GEMINI_API_KEY_PRIMARY"),
        os.getenv("GEMINI_API_KEY_SECONDARY"),
    )
    if api_key
]


def _is_rate_limited(error):
    status_code = getattr(error, "status_code", None)
    status = getattr(error, "status", None)
    message = str(error).lower()
    return (
        status_code == 429
        or status == "RESOURCE_EXHAUSTED"
        or "429" in message
        or "resource exhausted" in message
    )

EMPTY_SALARY = {"salary_min": None, "salary_max": None, "salary_type": None}


def call_gemini_api_with_retry(prompt, max_retries = 5, delay = 60):
    if not GEMINI_CLIENTS:
        print("Gemini is not configured; set GEMINI_API_KEY_PRIMARY.")
        return None

    client_index = 0
    for attempt in range(1, max_retries + 1):
        try:
            return GEMINI_CLIENTS[client_index].models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
        except Exception as e: 
            status_code = getattr(e, "status_code", None)
            status = getattr(e, "status", None)
            msg = str(e).lower()

            if _is_rate_limited(e) and client_index + 1 < len(GEMINI_CLIENTS):
                client_index += 1
                print("Gemini rate limit reached; switching to the secondary API key.")
                continue

            if status_code in (429, 503) or status in ("UNAVAILABLE", "RESOURCE_EXHAUSTED") or "high demand" in msg or "503" in msg:
                if attempt == max_retries:
                    print(f"Gemini still unavailable after {max_retries} attempts: {e}")
                    return None
                print(f"Gemini retrying in {delay}s (attempt {attempt}/{max_retries})")
                time.sleep(delay)
                continue
            raise

    print("gemini still not available, skipping")
    return None


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
       * If currency is not explicit, use the posting's wording, country, location,
         and currency conventions to make your best judgment before converting to USD.
         If it remains genuinely ambiguous, return null for salary_min, salary_max,
         and salary_type; do not default to USD.

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
    # A salary is optional metadata. Never let an unavailable or malformed
    # model response discard the otherwise valid posting in the scraper.
    try:
        response = call_gemini_api_with_retry(prompt)
        if response is None:
            return EMPTY_SALARY.copy()

        data = json.loads(response.text.strip())
        salary_min = data["salary_min"]
        salary_max = data["salary_max"]
        salary_type = data["salary_type"]

        if salary_type not in {"hourly", "yearly", None}:
            raise ValueError(f"unexpected salary type: {salary_type!r}")
        for name, value in (("salary_min", salary_min), ("salary_max", salary_max)):
            if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float))):
                raise ValueError(f"{name} must be a number or null")

        return {"salary_min": salary_min,
                "salary_max": salary_max,
                "salary_type": salary_type}
    except Exception as exc:
        print(f"Gemini salary extraction failed; saving posting without salary: {exc}")
        return EMPTY_SALARY.copy()
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
