from fastapi import APIRouter
from api.db import query

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
        
    for date, category, count in each_category:
        answer[date][category] = count
        
    return list(answer.values())
    
    # total = []
    # for i in rows:
    #     item = {"date": str(i[0]), "count": i[1]}
    #     total.append(item)
        
    # each = []
    # for i in each_category:
    #     item = {"date": str(i[0]), "category": str(i[1]), "count": i[2]}
    #     each.append(item)
    
    

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
    
    category = query("""
        SELECT unnest(skills) as skill, job_category, COUNT(*) AS count
        FROM postings
        GROUP BY skill, job_category
        ORDER BY count DESC;                  
    """)
    
    rows = all_rows[:20]

    total = 0
    for i in rows:
        total += i[1]
    
    top_three = 0
    for i in range(min(3, len(rows))):
        top_three += concentration[i][1]
    
    if total > 0:
        concentration_percent = top_three / total * 100
    else:
        concentration_percent = 0

    answer = {}
    for i in rows:
        item = {"skill": i[0], "count": i[1]}
        answer.append(item)
        
    for skill, job_category, count in category:
        answer[skill][job_category] = count

    return {"skills": answer, "concentration": concentration_percent}

@router.get("/postings")
def get_postings():
    rows = query("""
        SELECT title, company, location, date_posted
        FROM postings
        WHERE date_posted IS NOT NULL
        ORDER BY date_posted DESC
        LIMIT 50;
    """)
    
    result = query("""
        SELECT COUNT(*) AS total
        FROM postings
        WHERE date_posted IS NOT NULL;    
    """)
    
    total_postings = result[0][0]

    answer = []
    for i in rows:
        item = {"title": i[0], "company": i[1], "location": i[2], "date_posted": str(i[3]) if i[3] else None}
        answer.append(item)

    return {"total_postings": int(total_postings), "postings": answer}

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
    
    latest_count = rows[0][1]
    old_count = rows[1][1]
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
    
    top_skill = skills[0][0]
    
    median = query("""
        SELECT 
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_min) AS median_min,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_max) AS median_max
        FROM postings
        WHERE salary_min IS NOT NULL or salary_max IS NOT NULL;          
    """)
    
    median_min = median[0][0]
    median_max = median[0][1]
    
    def format_k(value):
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
    return {"message": "Welcome to Market Pulse API"}


