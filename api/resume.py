from fastapi import APIRouter, UploadFile, File, HTTPException
import PyPDF2
import os
from api.db import query
from analysis.skill_extractor import extract_skills
from io import BytesIO

router = APIRouter()

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as failure:
        raise HTTPException(status_code = 400, detail = f"Failed to parse PDF because of {str(failure)}")

    
@router.post("/resume_upload")
async def resume_upload(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code = 400, detail = "Only PDF are allowed")
    
    file_got = await file.read()
    resume_text = extract_text_from_pdf(file_got)
        
    if not resume_text.strip():
        raise HTTPException(status_code = 400, detail = "Could not extract text from PDF")
    
    resume_skills = extract_skills(resume_text)
    
    if not resume_skills:
        raise HTTPException(status_code = 400, detail = "Could not extract skills")
    
    #all the skills in DB
    all_skills_result = query("""
        SELECT DISTINCT unnest(skills) AS skill
        FROM postings
        WHERE skills IS NOT NULL AND skills != '{}'
    """)
    # top jobs that each skill has to offer
    job_matches = {}

    if resume_skills:
        resume_lower = {s.lower() for s in resume_skills}

        jobs_rows = query("""
            SELECT title, company, salary_min, salary_max, unnest(skills) AS skill
            FROM postings
            WHERE skills IS NOT NULL AND skills != '{}' AND skills && %s
            ORDER BY salary_max DESC NULLS LAST
            LIMIT 500
        """, (resume_skills,))

        for title, company, sal_min, sal_max, skill in jobs_rows:
            # if skill is not in resume, leave it
            normalized_skill = skill.lower()
            if normalized_skill not in resume_lower:
                continue
            
            # if skill is not yet in the dictionary as a key, we gotta add it
            if normalized_skill not in job_matches:
                job_matches[normalized_skill] = []

            if len(job_matches[normalized_skill]) < 5:
                job_matches[normalized_skill].append({
                    "title": title,
                    "company": company,
                    "salary_min": sal_min,
                    "salary_max": sal_max
                })


    
    
    # top missing skills
    missing_skills_result = query("""
        SELECT unnest(skills) AS skill, COUNT(*) as count
        FROM postings
        WHERE skills IS NOT NULL AND skills != '{}'
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 30
    """)
    
    all_market_skills = {}
    for row in missing_skills_result:
        skill = row[0]
        count = row[1]
        all_market_skills[skill] = count

    resume_skills_lower = [s.lower() for s in resume_skills]

    missing_skills = {}
    for skill, count in all_market_skills.items():
        if skill.lower() not in resume_skills_lower:
            missing_skills[skill] = count
    
    # top jobs that the user qualifies for, for each skills 
    matched_job_ids = query("""
        SELECT id, title, company, location, description, date_posted, salary_min, salary_max,
               salary_type, posting_url, skills
        FROM postings
        WHERE date_posted >= NOW() - INTERVAL '30 days'
        AND (
            SELECT COUNT(*)
            FROM unnest(skills) AS s
            WHERE s = ANY(%s)
        ) >= 3
        ORDER BY date_posted DESC, salary_max DESC NULLS LAST
        LIMIT 40
        """, (resume_skills,))
    
    matched_jobs = []
    for (job_id, title, company, location, description, date_posted, sal_min, sal_max,
         salary_type, posting_url, job_skills) in matched_job_ids:
        
        if job_skills:
           total_skills = len(job_skills)
        else:
            total_skills = 0 
        
        overlap = len(set(job_skills) & set(resume_skills))
        matched_jobs.append({
            "title": title,
            "company": company,
            "location": location,
            "description": description,
            "date_posted": str(date_posted) if date_posted else None,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "salary_type": salary_type,
            "posting_url": posting_url,
            "matched_skills": overlap,
            "total_skills": total_skills
        })

    market_total = query("""
        SELECT COUNT(*)
        FROM postings
        WHERE skills IS NOT NULL AND skills != '{}'
    """)[0][0]

    matching_job_count = query("""
        SELECT COUNT(*)
        FROM postings
        WHERE skills IS NOT NULL AND skills != '{}'
        AND (
            SELECT COUNT(*)
            FROM unnest(skills) AS s
            WHERE s = ANY(%s)
        ) >= 3
    """, (resume_skills,))[0][0]

    gap_rows = query("""
        WITH matching_postings AS (
            SELECT skills
            FROM postings
            WHERE skills IS NOT NULL AND skills != '{}'
            AND (
                SELECT COUNT(*)
                FROM unnest(skills) AS s
                WHERE s = ANY(%s)
            ) >= 3
        )
        SELECT skill, COUNT(*) AS count
        FROM matching_postings
        CROSS JOIN LATERAL unnest(skills) AS skill
        WHERE NOT (LOWER(skill) = ANY(%s))
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 1
    """, (resume_skills, resume_skills_lower))

    salary_row = query("""
        SELECT
            COUNT(*) FILTER (
                WHERE salary_min IS NOT NULL AND salary_max IS NOT NULL
            ) AS salary_sample_size,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_min) AS median_min,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_max) AS median_max
        FROM postings
        WHERE skills IS NOT NULL AND skills != '{}'
        AND (
            SELECT COUNT(*)
            FROM unnest(skills) AS s
            WHERE s = ANY(%s)
        ) >= 3
    """, (resume_skills,))[0]

    top_gap = (
        {"skill": gap_rows[0][0], "matching_roles": gap_rows[0][1]}
        if gap_rows else None
    )
    salary_sample_size, median_min, median_max = salary_row
    salary_summary = None
    if salary_sample_size >= 5 and median_min is not None and median_max is not None:
        salary_summary = {
            "sample_size": salary_sample_size,
            "median_min": median_min,
            "median_max": median_max,
        }
        
    return {
        "resume_skills": resume_skills,
        "matched_jobs": matched_jobs,
        "top_missing_skills": dict(list(missing_skills.items())[:14]),
        "skill_opportunities": job_matches,
        "market_snapshot": {
            "market_total": market_total,
            "matching_job_count": matching_job_count,
            "top_gap": top_gap,
            "salary": salary_summary,
        },
    }
