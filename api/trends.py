from fastapi import APIRouter
from api.db import query

router = APIRouter()

@router.get("/trends")
def get_trends():
    rows = query("""
        SELECT date_posted, COUNT(*) as count
        FROM postings
        WHERE date_posted IS NOT NULL
        GROUP BY date_posted
        ORDER BY date_posted""")
    
    answer = []
    for i in rows:
        item = {"date": str(i[0]), "count": i[1]}
        answer.append(item)
    
    return answer

@router.get("/skills")
def get_skills():
    rows = query("""SELECT unnest(skills) as skill, COUNT(*) as count
        FROM postings
        WHERE skills IS NOT NULL
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
        SELECT title, company, location, date_posted
        FROM postings
        WHERE date_posted IS NOT NULL
        ORDER BY date_posted DESC
        LIMIT 50
    """)

    answer = []
    for i in rows:
        item = {"title": i[0], "company": i[1], "location": i[2], "date_posted": str(i[3]) if i[3] else None}
        answer.append(item)

    return answer

@router.get("/salary")
def get_salary():
    return {"message": "Salary extraction coming soon"}

@router.api_route("/health", methods = ["GET", "HEAD"])
def health():
    return {"message": "Bello!!!"}

@router.get("/")
def home():
    return {"message": "Welcome to Market Pulse API"}


