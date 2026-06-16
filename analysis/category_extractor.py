import re
import os
from dotenv import load_dotenv
import psycopg2
from google import genai
import time

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "text/plain"
        }
    )
                
    answer = response.text.strip().lower()
    return answer
    

def category_extractor():
    DB = psycopg2.connect(os.environ["DATABASE_URL"])
    with DB.cursor() as cur:
        cur.execute("SELECT id, title FROM postings WHERE job_category IS NULL ORDER BY id")

        rows = cur.fetchall()
        print(f"Processing {len(rows)} postings...")

        for row_id, title in rows:
            time.sleep(0.75)
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