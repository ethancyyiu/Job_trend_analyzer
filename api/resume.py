from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
import PyPDF2
import os
import re
import uuid
from typing import Literal
from functools import lru_cache
from psycopg2.extras import Json
from api.db import query
from analysis.skill_extractor import extract_skills
from io import BytesIO

router = APIRouter()

ANNUAL_WORK_HOURS = 2_080


class ResumeDocumentResponse(BaseModel):
    id: str
    filename: str
    raw_text: str


class ResumeTextUpdate(BaseModel):
    raw_text: str = Field(min_length=1, max_length=200_000)


class JobPreferences(BaseModel):
    target_job_titles: list[str] = Field(default_factory=list, max_length=10)
    preferred_locations: list[str] = Field(default_factory=list, max_length=10)
    prioritized_skills: list[str] = Field(default_factory=list, max_length=20)
    remote_preference: Literal["remote", "hybrid", "on_site", "no_preference"] = "no_preference"
    work_authorization: Literal["authorized", "requires_sponsorship", "no_preference"] = "no_preference"
    minimum_salary: float | None = Field(default=None, ge=0, le=10_000_000)
    salary_type: Literal["yearly", "hourly", "no_preference"] = "yearly"


class ResumePreferencesResponse(BaseModel):
    id: str
    preferences: JobPreferences


@lru_cache(maxsize=1)
def ensure_resume_documents_table():
    """Create resume-text storage in deployments without a migration runner."""
    query("""
        CREATE TABLE IF NOT EXISTS resume_documents (
            id UUID PRIMARY KEY,
            filename TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    # Existing local and deployed databases may have been created before
    # preferences were introduced.
    query("""
        ALTER TABLE resume_documents
        ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb
    """)

@router.get("/resume_skills")
def get_resume_skills():
    rows = query("""
        SELECT DISTINCT skill.value
        FROM postings
        CROSS JOIN LATERAL unnest(skills) AS skill(value)
        WHERE skill.value IS NOT NULL AND BTRIM(skill.value) <> ''
        ORDER BY skill.value
    """)
    skills_by_key = {}
    for row in rows:
        skill = row[0].strip()
        # Postings retain source variations such as "fast api" / "fastapi"
        # and "ci/cd" / "cicd" for extraction coverage. The picker only
        # needs one choice for each of those equivalent forms.
        normalized_key = re.sub(r"[\s./_-]+", "", skill).casefold()
        current = skills_by_key.get(normalized_key)
        if current is None or len(skill) < len(current):
            skills_by_key[normalized_key] = skill

    return {"skills": sorted(skills_by_key.values(), key=str.casefold)}

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as failure:
        raise HTTPException(status_code = 400, detail = f"Failed to parse PDF because of {str(failure)}")


@router.post("/resume_documents", response_model=ResumeDocumentResponse, status_code=201)
async def create_resume_document(file: UploadFile = File(...)):
    """Extract a PDF and persist its text for user review before matching."""
    is_pdf = file.content_type == "application/pdf" or (file.filename or "").lower().endswith(".pdf")
    if not is_pdf:
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Resume PDFs must be 10 MB or smaller.")

    raw_text = extract_text_from_pdf(file_bytes).strip()
    if not raw_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in this PDF. Please upload a text-based PDF.",
        )

    ensure_resume_documents_table()
    document_id = uuid.uuid4()
    filename = (file.filename or "resume.pdf").strip()[:255]
    query(
        """
        INSERT INTO resume_documents (id, filename, raw_text)
        VALUES (%s, %s, %s)
        """,
        (str(document_id), filename, raw_text),
    )
    return ResumeDocumentResponse(id=str(document_id), filename=filename, raw_text=raw_text)


@router.put("/resume_documents/{document_id}", response_model=ResumeDocumentResponse)
def update_resume_document(document_id: uuid.UUID, update: ResumeTextUpdate):
    """Persist edits made after reviewing the PDF extraction."""
    ensure_resume_documents_table()
    raw_text = update.raw_text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")

    rows = query(
        """
        UPDATE resume_documents
        SET raw_text = %s, updated_at = NOW()
        WHERE id = %s
        RETURNING id, filename, raw_text
        """,
        (raw_text, str(document_id)),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Resume document was not found.")
    row = rows[0]
    return ResumeDocumentResponse(id=str(row[0]), filename=row[1], raw_text=row[2])


@router.put("/resume_documents/{document_id}/preferences", response_model=ResumePreferencesResponse)
def update_resume_preferences(document_id: uuid.UUID, preferences: JobPreferences):
    """Store the candidate's stated search preferences with their resume."""
    ensure_resume_documents_table()
    cleaned_preferences = preferences.model_dump()
    cleaned_preferences["target_job_titles"] = [
        title.strip() for title in cleaned_preferences["target_job_titles"] if title.strip()
    ]
    cleaned_preferences["preferred_locations"] = [
        location.strip() for location in cleaned_preferences["preferred_locations"] if location.strip()
    ]
    cleaned_preferences["prioritized_skills"] = [
        skill.strip() for skill in cleaned_preferences["prioritized_skills"] if skill.strip()
    ]
    if cleaned_preferences["minimum_salary"] is not None and cleaned_preferences["salary_type"] == "hourly":
        # Store a single annual compensation value so recommendation matching
        # can compare it directly with annual job salaries.
        cleaned_preferences["minimum_salary"] *= ANNUAL_WORK_HOURS
        cleaned_preferences["salary_type"] = "yearly"
    rows = query(
        """
        UPDATE resume_documents
        SET preferences = %s, updated_at = NOW()
        WHERE id = %s
        RETURNING id, preferences
        """,
        (Json(cleaned_preferences), str(document_id)),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Resume document was not found.")
    row = rows[0]
    return ResumePreferencesResponse(id=str(row[0]), preferences=row[1])

    
@router.post("/resume_upload")
async def resume_upload(
    file: UploadFile = File(...),
    target_role: str | None = Form(None),
    emphasis_skills: list[str] = Form([]),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code = 400, detail = "Only PDF are allowed")
    
    file_got = await file.read()
    resume_text = extract_text_from_pdf(file_got)
        
    if not resume_text.strip():
        raise HTTPException(status_code = 400, detail = "Could not extract text from PDF")
    
    resume_skills = extract_skills(resume_text)
    
    if not resume_skills:
        raise HTTPException(status_code = 400, detail = "Could not extract skills")

    target_role = target_role.strip().lower() if target_role and target_role.strip() else None
    emphasis_skills = list(dict.fromkeys(skill.strip() for skill in emphasis_skills if skill.strip()))
    emphasis_skills_lower = {skill.lower() for skill in emphasis_skills}
    
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
        AND (%s IS NULL OR job_category = %s)
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 100
    """, (target_role, target_role))
    
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

    prioritized_missing_skills = {
        skill: count for skill, count in missing_skills.items()
        if skill.lower() in emphasis_skills_lower
    }
    remaining_missing_skills = {
        skill: count for skill, count in missing_skills.items()
        if skill.lower() not in emphasis_skills_lower
    }
    missing_skills = {**prioritized_missing_skills, **remaining_missing_skills}
    
    # top jobs that the user qualifies for, for each skills 
    matched_job_ids = query("""
        SELECT id, title, company, location, description, date_posted, salary_min, salary_max,
               salary_type, posting_url, skills, job_category
        FROM postings
        WHERE date_posted >= NOW() - INTERVAL '30 days'
        AND (
            SELECT COUNT(*)
            FROM unnest(skills) AS s
            WHERE s = ANY(%s)
        ) >= 3
        ORDER BY CASE WHEN %s IS NOT NULL AND job_category = %s THEN 0 ELSE 1 END,
                 date_posted DESC, salary_max DESC NULLS LAST
        LIMIT 40
        """, (resume_skills, target_role, target_role))
    
    matched_jobs = []
    for (job_id, title, company, location, description, date_posted, sal_min, sal_max,
         salary_type, posting_url, job_skills, job_category) in matched_job_ids:
        
        if job_skills:
           total_skills = len(job_skills)
        else:
            total_skills = 0 
        
        matched_skill_names = {skill.lower() for skill in job_skills} & set(resume_skills_lower)
        overlap = len(matched_skill_names)
        emphasis_matches = len(matched_skill_names & emphasis_skills_lower)
        fit_score = min(100, round((overlap / total_skills) * 100 + emphasis_matches * 5)) if total_skills else 0
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
            "total_skills": total_skills,
            "fit_score": fit_score,
            "priority_matches": emphasis_matches,
            "job_category": job_category,
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
        "focus": {"target_role": target_role, "emphasis_skills": emphasis_skills},
        "skill_opportunities": job_matches,
        "market_snapshot": {
            "market_total": market_total,
            "matching_job_count": matching_job_count,
            "top_gap": top_gap,
            "salary": salary_summary,
        },
    }
