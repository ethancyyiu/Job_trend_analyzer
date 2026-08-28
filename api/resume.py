from fastapi import APIRouter, UploadFile, File, HTTPException
import PyPDF2
import os
from api.db import query
from analysis.skill_extractor import extract_skills

router = APIRouter()

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(file_bytes)
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
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    resume_skills = extract_skills(resume_text)
    
    if not resume_skills:
        raise HTTPException(status_code=400, detail="Could not extract skills")
    
    all_skills_result = query("""
        SELECT DISTINCT unnest(skills) AS skill
        FROM postings
        WHERE skills IS NOT NULL AND skills != '{}'
    """)
    all_skills = [row[0] for row in all_skills_result]
    
    job_matches = {}
    for skill in resume_skills:
        skill_lower = skill.lower()
        
        jobs = query("""
            SELECT title, company, salary_min, salary_max
            FROM postings
            WHERE %s = ANY(skills)
            ORDER BY salary_max DESC NULLS LAST
            LIMIT 5
        """, (skill_lower,))
        
        if jobs:
            job_matches[skill] = [
                {
                    "title": job[0],
                    "company": job[1],
                    "salary_min": job[2],
                    "salary_max": job[3]
                }
                for job in jobs
            ]
    