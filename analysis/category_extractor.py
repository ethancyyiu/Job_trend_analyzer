import re
import os
from dotenv import load_dotenv
import psycopg2
from google import genai
from google.genai.errors import ServerError
import time

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def call_gemini_api_with_retry(client, prompt, max_retries=3, delay=15):
    # retry gemini call with a delay when 503 comes
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
                config={
                    "response_mime_type": "text/plain"
                }
            )
        except ServerError as e:
            if getattr(e, "status_code", None) == 503:
                print(f"Gemini 503 retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
            else:
                raise

    print("Gemini still not available, skipping")
    return None


def get_gemini(text):
    print("CALLED GEMINI API!!!!!!!!!\n")
    prompt = f"""
        You are a strict job title classifier.

        I will give you a job title.  Your task is to classify it into exactly one of the following categories:

- Software Engineer
- Data Engineer
- Machine Learning Engineer
- Data Scientist
- Data Analyst
- Others

Rules:
- Do NOT guess.
- If the job title does not clearly indicate one of the four roles, return "Others".
- Ignore seniority levels (junior, senior, lead, principal).
- Ignore company names and irrelevant modifiers.
- Base your decision ONLY on the job title.

Return ONLY the category name exactly as written above.

Job title: {text}
    """
    response = call_gemini_api_with_retry(client, prompt)
    if response is None:
        return "others"

    answer = response.text.strip().lower()
    return answer
    

def category_extractor():
    DB = psycopg2.connect(os.environ["DATABASE_URL"])
    with DB.cursor() as cur:
        cur.execute("SELECT id, title FROM postings WHERE job_category IS NULL ORDER BY id")

        rows = cur.fetchall()
        print(f"Processing {len(rows)} postings...")

        for row_id, title in rows:
            print(f"id: {row_id}")
            if re.search(r"software engineer", title, re.IGNORECASE):
                category = "software engineer"
                
            elif re.search(r"data engineer", title, re.IGNORECASE):
                category = "data engineer"
                
            elif re.search(r"machine learning engineer", title, re.IGNORECASE):
                category = "machine learning engineer"
                
            elif re.search(r"data scientist", title, re.IGNORECASE):
                category = "data scientist"
                
            elif re.search(r"data analyst", title, re.IGNORECASE):
                category = "data analyst" 
                
            else:
                time.sleep(10)
                category = get_gemini(title)

            print(category)
            cur.execute(
                "UPDATE postings SET job_category = %s WHERE id = %s",
                (category, row_id)
            )

            DB.commit()
        print("all done!")
        
if __name__ == "__main__":
    category_extractor()