from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Query, Response
from api.db import query
from analysis.predictions import JOB_CATEGORIES

router = APIRouter()

@router.get("/trends")
def get_trends():
    rows = query("""
        SELECT date_posted, COUNT(*) as count
        FROM postings
        WHERE date_posted IS NOT NULL
        AND date_posted >= NOW() - INTERVAL '60 days'
        GROUP BY date_posted
        ORDER BY date_posted""")
    
    each_category = query("""
        SELECT date_posted, job_category, COUNT(*) as count 
        FROM postings
        WHERE date_posted IS NOT NULL
        AND date_posted >= NOW() - INTERVAL '60 days'
        GROUP BY date_posted, job_category
        ORDER BY date_posted""")
    
    answer = {}
    for date, count in rows:
        answer[date] = {"date": date, "count": count}
        for cat in JOB_CATEGORIES:
            answer[date][cat] = 0
        
    for date, category, count in each_category:
        if date not in answer:
            answer[date] = {"date": date, "count": 0}
        answer[date][category] = count
        
    return list(answer.values())

@router.get("/metadata")
def get_metadata():
    # `scrape_runs` is an audit table populated only after the whole pipeline
    # completes. Older databases (and interrupted runs) can still contain
    # successfully saved postings without an audit row, so use the latest
    # saved posting as the availability fallback.
    try:
        rows = query("""
            SELECT completed_at
            FROM scrape_runs
            ORDER BY completed_at DESC
            LIMIT 1
        """)
    except Exception:
        rows = []

    if rows and rows[0][0]:
        last_scraped_at = rows[0][0]
    else:
        try:
            posting_rows = query("""
                SELECT MAX(date_scraped)
                FROM postings
                WHERE date_scraped IS NOT NULL
            """)
        except Exception:
            posting_rows = []
        last_scraped_at = posting_rows[0][0] if posting_rows else None

    return {"last_scraped_at": last_scraped_at.isoformat() if last_scraped_at else None}

@router.get("/trends/forecast")
def get_forecast(response: Response):
    try:
        rows = query("""
            SELECT payload
            FROM forecast_cache
            WHERE cache_key = 'daily_trends'
            -- Do not depend on the new id column here: the writer migrates
            -- older databases on its next successful forecast run.
            ORDER BY generated_at DESC
            LIMIT 1
        """)
    except Exception:
        # The scraper creates this table. Until its first successful run, the
        # UI reserves the prediction area and communicates that it is pending.
        rows = []

    if not rows:
        response.status_code = 202
        return {"status": "pending"}

    response.headers["Cache-Control"] = "public, max-age=300"
    return rows[0][0]

@router.get("/skills")
def get_skills():
    concentration = query("""
        SELECT unnest(skills) AS skill, COUNT(*) AS count
        FROM postings
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 3;
    """)
    
    all_rows = query("""
        SELECT unnest(skills) AS skill, COUNT(*) AS count
        FROM postings
        GROUP BY skill
        ORDER BY count DESC;
    """)
    
    rows = all_rows[:20]

    total = 0
    for i in all_rows:
        total += i[1]
    
    top_three = 0
    for i in range(min(3, len(concentration))):
        top_three += concentration[i][1]
    
    if total > 0:
        concentration_percent = top_three / total * 100
    else:
        concentration_percent = 0

    momentum_rows = query("""
        WITH current_period AS (
            SELECT unnest(skills) AS skill, COUNT(*) AS count
            FROM postings
            WHERE date_posted >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY skill
        ), previous_period AS (
            SELECT unnest(skills) AS skill, COUNT(*) AS count
            FROM postings
            WHERE date_posted >= CURRENT_DATE - INTERVAL '60 days'
              AND date_posted < CURRENT_DATE - INTERVAL '30 days'
            GROUP BY skill
        )
        SELECT COALESCE(current_period.skill, previous_period.skill) AS skill,
               COALESCE(current_period.count, 0) AS current_count,
               COALESCE(previous_period.count, 0) AS previous_count
        FROM current_period
        FULL OUTER JOIN previous_period ON current_period.skill = previous_period.skill
    """)

    momentum = [
        {
            "skill": row[0],
            "current_count": int(row[1]),
            "previous_count": int(row[2]),
            "change": int(row[1]) - int(row[2]),
        }
        for row in momentum_rows
    ]
    rising = sorted((item for item in momentum if item["change"] > 0), key=lambda item: item["change"], reverse=True)[:3]
    falling = sorted((item for item in momentum if item["change"] < 0), key=lambda item: item["change"])[:3]

    answer = []
    for i in rows:
        item = {"skill": i[0], "count": i[1]}
        answer.append(item)

    return {
        "skills": answer,
        "concentration": concentration_percent,
        "total_mentions": total,
        "momentum": {"rising": rising, "falling": falling},
    }

@router.get("/postings")
def get_postings(days: int = Query(30, ge=1, le=365), page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=100), search: str | None = Query(None, max_length=100), location: str | None = Query(None, max_length=120)):
    start_date = date.today() - timedelta(days=days)
    where = ["date_posted IS NOT NULL", "date_posted >= %s"]
    params = [start_date]
    if search and search.strip():
        where.append("(title ILIKE %s OR company ILIKE %s OR location ILIKE %s)")
        value = f"%{search.strip()}%"
        params.extend([value, value, value])
    if location and location.strip():
        where.append("location = %s")
        params.append(location.strip())
    where_sql = " AND ".join(where)
    rows = query(f"""
        SELECT id, title, company, location, date_posted, posting_url
        FROM postings
        WHERE {where_sql}
        ORDER BY date_posted DESC, id DESC
        LIMIT %s OFFSET %s;
    """, (*params, limit, (page - 1) * limit))
    
    result = query(f"SELECT COUNT(*) FROM postings WHERE {where_sql}", params)
    
    total_postings = result[0][0]

    answer = []
    for i in rows:
        item = {
            "id": i[0],
            "title": i[1],
            "company": i[2],
            "location": i[3],
            "date_posted": str(i[4]) if i[4] else None,
            "posting_url": i[5],
        }
        answer.append(item)

    return {"total_postings": int(total_postings), "days": days, "page": page, "limit": limit, "has_more": page * limit < total_postings, "postings": answer}

@router.get("/postings/{posting_id}")
def get_posting_details(posting_id: int):
    rows = query("""
        SELECT id, title, company, location, description, date_posted,
               salary_min, salary_max, salary_type, posting_url
        FROM postings
        WHERE id = %s;
    """, (posting_id,))

    if not rows:
        raise HTTPException(status_code=404, detail="Posting not found")

    row = rows[0]
    return {
        "id": row[0],
        "title": row[1],
        "company": row[2],
        "location": row[3],
        "description": row[4],
        "date_posted": str(row[5]) if row[5] else None,
        "salary_min": float(row[6]) if row[6] is not None else None,
        "salary_max": float(row[7]) if row[7] is not None else None,
        "salary_type": row[8],
        "posting_url": row[9],
    }

@router.get("/salary")
def get_salary():
    # sample testing query
    sample = query(""" 
        SELECT salary_min, salary_max, salary_type
        FROM postings
        WHERE (salary_min IS NOT NULL OR salary_max IS NOT NULL)
        AND salary_type IS NOT NULL
        LIMIT 10; 
    """)
    
    # how much of total postings have salary data
    coverage = query(""" 
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE salary_min IS NOT NULL) AS has_salary
        FROM postings;
    """)
    
    total = coverage[0][0]
    has_salary = coverage[0][1]
    
    if total and total > 0:
        coverage_percent = has_salary / total * 100
    else:
        coverage_percent = 0
    
    # yearly vs hourly percentage comparison
    type_amount = query("""
        SELECT salary_type, COUNT(*) AS count 
        FROM postings
        WHERE salary_type IS NOT NULL
        GROUP BY salary_type;                    
    """)
    
    type_dictionary = {}
    for types in type_amount:
        salary_type = types[0]
        count = types[1]
        type_dictionary[salary_type] = count
        
    hourly = type_dictionary.get("hourly", 0)
    yearly = type_dictionary.get("yearly", 0)
    
    combined = hourly + yearly
    
    if combined > 0:
        hourly_percentage = hourly / combined * 100
        yearly_percentage = yearly / combined * 100
    else:
        hourly_percentage = 0
        yearly_percentage = 0
        
    # median of salary_min and salary_max
    median = query("""
        SELECT 
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_min) AS median_min,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_max) AS median_max
        FROM postings
        WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL;          
    """)
    
    median_min = median[0][0]
    median_max = median[0][1]
    
    # find median of salary_min and salary_max of each job category
    each_median = query("""
        SELECT 
            job_category,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_min) AS median_minimum,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_max) AS median_maximum
        FROM postings
        WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL
        GROUP BY job_category
    """)
    
    each_category_median = []
    for i in each_median:
        item = {"title": i[0], "median_minimum": i[1], "median_maximum": i[2]}
        each_category_median.append(item)

    salary_bands = query("""
        WITH yearly_salaries AS (
            SELECT COALESCE((salary_min + salary_max) / 2, salary_min, salary_max) AS midpoint
            FROM postings
            WHERE salary_type = 'yearly'
              AND (salary_min IS NOT NULL OR salary_max IS NOT NULL)
        ), banded AS (
            SELECT CASE
                WHEN midpoint < 50000 THEN 'Under $50k'
                WHEN midpoint < 75000 THEN '$50k - $75k'
                WHEN midpoint < 100000 THEN '$75k - $100k'
                WHEN midpoint < 125000 THEN '$100k - $125k'
                WHEN midpoint < 150000 THEN '$125k - $150k'
                ELSE '$150k and above'
            END AS label,
            CASE
                WHEN midpoint < 50000 THEN 1
                WHEN midpoint < 75000 THEN 2
                WHEN midpoint < 100000 THEN 3
                WHEN midpoint < 125000 THEN 4
                WHEN midpoint < 150000 THEN 5
                ELSE 6
            END AS position
            FROM yearly_salaries
        )
        SELECT label, COUNT(*) AS count
        FROM banded
        GROUP BY label, position
        ORDER BY position
    """)

    coverage_by_role = query("""
        SELECT COALESCE(job_category, 'Uncategorized') AS role,
               COUNT(*) FILTER (WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL) AS disclosed_count,
               COUNT(*) AS posting_count
        FROM postings
        GROUP BY job_category
        HAVING COUNT(*) > 0
        ORDER BY (COUNT(*) FILTER (WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL))::numeric / COUNT(*) DESC,
                 disclosed_count DESC
        LIMIT 5
    """)
    
    return {
        "sample": sample,
        "coverage_percentage": coverage_percent,
        "coverage_count": has_salary,
        
        "median_min": median_min,
        "median_max": median_max,
        
        "hourly_count": hourly,
        "yearly_count": yearly,
        "hourly_percentage": hourly_percentage,
        "yearly_percentage": yearly_percentage,
        
        "each_category_median": each_category_median,
        "salary_bands": [{"label": row[0], "count": int(row[1])} for row in salary_bands],
        "coverage_by_role": [
            {"role": row[0], "disclosed_count": int(row[1]), "posting_count": int(row[2])}
            for row in coverage_by_role
        ],
        
        "total_postings": total,
    }
    
@router.get("/home")
def home():
    rows = query("""
        SELECT date_posted, COUNT(*) as count
        FROM postings
        WHERE date_posted IS NOT NULL
        GROUP BY date_posted
        ORDER BY date_posted DESC
        LIMIT 2""")
    
    latest_count = rows[0][1] if rows else 0
    old_count = rows[1][1] if len(rows) > 1 else 0
    momentum = 0
    if old_count > 0:
        momentum = (latest_count - old_count) / old_count
    else:
        momentum = 0
        
    skills = query("""
        SELECT unnest(skills) AS skill, COUNT(*) AS count
        FROM postings
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 1;
    """)
    
    top_skill = skills[0][0] if skills else None
    
    median = query("""
        SELECT 
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_min) AS median_min,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_max) AS median_max
        FROM postings
        WHERE salary_min IS NOT NULL or salary_max IS NOT NULL;          
    """)
    
    median_min = median[0][0] if median else None
    median_max = median[0][1] if median else None
    
    def format_k(value):
        if value is None:
            return None
        if value >= 1000:
            return f"{int(value / 1000)}k"
        return str(int(value))

    rounded_median_min = format_k(median_min)
    rounded_median_max = format_k(median_max)
    
    number = query("SELECT COUNT(*) FROM postings")
    total = number[0][0]
    
    return {"momentum": momentum, "top_skill": top_skill, 
            "rounded_median_min": rounded_median_min,
            "rounded_median_max": rounded_median_max, 
            "total": total}
    

@router.api_route("/health", methods = ["GET", "HEAD"])
def health():
    return {"message": "Bello!!!"}

@router.get("/")
def welcome():
    return {"message": "Welcome to Market Pulse!!!!!!!!!"}


