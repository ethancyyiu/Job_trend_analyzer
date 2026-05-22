from fastapi import APIRouter
from api.main import query

router = APIrouter()

@router.get("/trends")
def get_trends():
    rows = query("""SELECT date_scraped, COUNT(*) as count
        FROM postings
        GROUP BY date_scraped
        ORDER BY date_scraped""")
    
    answer = []
    for i in rows:
        item = {"date": str(i[0]), "count": i[1]}
        result.append(item)
    
    return answer

@router.get("/skills")
def get_skills():
    rows = query("""SELECT unnest(skills) as skill, COUNT(*) as count
        FROM postings
        WHERE skill IS NOT NULL
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 20
    """)

    answer = []
    for i in rows:
        item = {"skill": i[0], "count": i[1]}
        answer.append(item)

    return answer

@router.get("/postings")
def get_postings():
    rows = query("""
        SELECT title, company, location, date_scraped
        FROM postings
        ORDER BY date_scraped DESC
        LIMIT 100
    """)

    answer = []
    for i in rows:
        item = {"title": r[0], "company": r[1], "location": r[2], "date": str(r[3])}
        answer.append(item)

    return answer        