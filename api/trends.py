from fastapi import APIrouter
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
        item = {"date": str(r[0]), "count": r[1]}
        result.append(item)
    
    return answer
        