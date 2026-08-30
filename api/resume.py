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
    all_skills = [row[0] for row in all_skills_result]
    
    
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
            if skill not in resume_lower:
                continue
            
            # if skill is not yet in the dictionary as a key, we gotta add it
            if skill not in job_matches:
                job_matches[skill] = []

            if len(job_matches[skill]) < 5:
                job_matches[skill].append({
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
        if skill not in resume_skills_lower:
            missing_skills[skill] = count
    
    # top jobs that the user qualifies for    
    matched_job_ids = query("""
        SELECT id, title, company, salary_min, salary_max, skills
        FROM postings
        WHERE (
            SELECT COUNT(*)
            FROM unnest(skills) AS s
            WHERE s = ANY(%s)
        ) >= 3
        ORDER BY salary_max DESC NULLS LAST
        LIMIT 20
        """, (resume_skills,))
    
    matched_jobs = []
    for job_id, title, company, sal_min, sal_max, job_skills in matched_job_ids:
        
        if job_skills:
           total_skills = len(job_skills)
        else:
            total_skills = 0 
        
        overlap = len(set(job_skills) & set(resume_skills))
        matched_jobs.append({
            "title": title,
            "company": company,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "matched_skills": overlap,
            "total_skills": total_skills
        })
        
    return {
        "resume_skills": resume_skills,
        "matched_jobs": matched_jobs,
        "top_missing_skills": dict(list(missing_skills.items())[:12]),
        "skill_opportunities": job_matches
    }

    