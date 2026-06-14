import re
import json

def run():
    DB = psycopg2.connect(os.environ["DATABASE_URL"])
    with DB.cursor() as cur:
        cur.execute("SELECT id, title FROM postings")

        rows = cur.fetchall()
        print(f"Processing {len(rows)} postings...")

        for row_id, title in rows:
            if re.search(r"software engineer", title, re.IGNORECASE):
                cur.execute(
                    "UPDATE postings SET job_category = 'software engineer' WHERE id = %s",
                    (row_id)
                )
            elif re.search(r"data engineer", title, re.IGNORECASE):
                cur.execute(
                    "UPDATE postings SET job_category = 'data engineer' WHERE id = %s",
                    (row_id)
                )
            elif re.search(r"machine learning engineer", title, re.IGNORECASE):
                cur.execute(
                    "UPDATE postings SET job_category = 'machine learning engineer' WHERE id = %s",
                    (row_id)
                )
            elif re.search(r"data scientist", title, re.IGNORECASE):
                cur.execute(
                    "UPDATE postings SET job_category = 'data scientist' WHERE id = %s",
                    (row_id)
                )
            else:
                response = client.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json"
                    }
                )
                
                answer = response.text.strip()
                result = json.loads(answer)

            DB.commit()
        print("all done!")