"""Job-recommendation endpoint: deterministic retrieval followed by Jev ranking."""

from __future__ import annotations

import asyncio
import logging
from collections import Counter
from statistics import median
from time import perf_counter
import uuid

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from api.db import query
from api.job_retrieval import (
    CandidateJob,
    hydrate_candidate_jobs,
    load_active_job_catalog,
    normalize_skill,
    retrieve_candidate_jobs,
    skills_from_text,
)
from api.resume import JobPreferences, ensure_resume_documents_table
from api.typesafe_jev import JevBatchResult, JevConfigurationError, JevScoreResult, TypeSafeJevClient


router = APIRouter()
POSSIBLE_MATCH_CONFIDENCE = 0.65
logger = logging.getLogger(__name__)


class JobRecommendation(BaseModel):
    job_id: int
    title: str
    company: str | None = None
    location: str | None = None
    salary_type: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    posting_url: str | None = None
    requirements: list[str] = Field(default_factory=list)
    nice_to_haves: list[str] = Field(default_factory=list)
    responsibilities: str | None = None
    description: str | None = None
    fit_score: float = Field(ge=0, le=4)
    confidence: float | None = Field(default=None, ge=0, le=1)
    match_label: str


class SkillGap(BaseModel):
    skill: str
    matching_roles: int


class SalaryRange(BaseModel):
    sample_size: int
    median_min: float
    median_max: float


class MarketInsights(BaseModel):
    role_count: int
    top_missing_skills: list[SkillGap] = Field(default_factory=list, max_length=14)
    most_common_skill_gap: SkillGap | None = None
    median_salary: SalaryRange | None = None


class RecommendationResponse(BaseModel):
    recommendations: list[JobRecommendation] = Field(default_factory=list, max_length=6)
    candidate_count: int
    scored_count: int
    input_tokens: int
    batch_errors: list[str] = Field(default_factory=list)
    market_insights: MarketInsights


def _load_resume_context(document_id: uuid.UUID) -> tuple[str, JobPreferences]:
    ensure_resume_documents_table()
    rows = query(
        """
        SELECT raw_text, preferences
        FROM resume_documents
        WHERE id = %s
        """,
        (str(document_id),),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Resume document was not found.")
    raw_text, preferences = rows[0]
    return raw_text, JobPreferences.model_validate(preferences or {})


def _merge_ranked_results(
    candidates: list[CandidateJob],
    batch_results: list[JevBatchResult],
) -> tuple[list[JobRecommendation], int, list[str]]:
    scores_by_job_id: dict[int, JevScoreResult] = {}
    input_tokens = 0
    errors: list[str] = []
    for batch in batch_results:
        if batch.input_tokens is not None:
            input_tokens += batch.input_tokens
        if batch.error:
            errors.append(f"Batch {batch.batch_index + 1}: {batch.error}")
        for score in batch.scores:
            if score.error:
                errors.append(f"Job {score.job_id}: {score.error}")
            if score.score is not None:
                scores_by_job_id[score.job_id] = score

    ranked: list[tuple[CandidateJob, JevScoreResult]] = [
        (candidate, scores_by_job_id[candidate.job.id])
        for candidate in candidates
        if candidate.job.id in scores_by_job_id
    ]
    ranked.sort(
        key=lambda item: (
            -item[1].score,
            -(item[1].confidence if item[1].confidence is not None else 0.0),
            -item[0].retrieval_score,
            item[0].job.id,
        )
    )
    recommendations = [
        JobRecommendation(
            job_id=candidate.job.id,
            title=candidate.job.title,
            company=candidate.job.company,
            location=candidate.job.location,
            salary_type=candidate.job.salary_type,
            salary_min=candidate.job.salary_min,
            salary_max=candidate.job.salary_max,
            posting_url=candidate.job.posting_url,
            requirements=candidate.job.requirements,
            nice_to_haves=candidate.job.nice_to_haves,
            responsibilities=candidate.job.responsibilities,
            description=candidate.job.description,
            fit_score=score.score,
            confidence=score.confidence,
            match_label=(
                "possible match"
                if score.confidence is None or score.confidence < POSSIBLE_MATCH_CONFIDENCE
                else "match"
            ),
        )
        for candidate, score in ranked[:6]
    ]
    return recommendations, input_tokens, errors


def _build_market_insights(resume_text: str, candidates: list[CandidateJob]) -> MarketInsights:
    """Summarize skill gaps and comparable pay across the Jev candidate pool."""
    resume_skills = skills_from_text(resume_text)
    missing_skill_counts: Counter[str] = Counter()
    skill_labels: dict[str, str] = {}
    salary_mins: list[float] = []
    salary_maxes: list[float] = []

    for candidate in candidates:
        job = candidate.job
        # `skills` contains the posting's user-facing skill labels, which lets
        # the UI recommend readable labels while matching aliases consistently.
        for skill in job.skills:
            label = skill.strip()
            normalized = normalize_skill(label)
            if not normalized or normalized in resume_skills:
                continue
            missing_skill_counts[normalized] += 1
            existing_label = skill_labels.get(normalized)
            if existing_label is None or len(label) < len(existing_label):
                skill_labels[normalized] = label

        # A median only makes sense for comparable annual salary ranges. Keep
        # the old five-posting minimum so a handful of listings cannot imply a
        # misleading market range.
        if (
            job.salary_type == "yearly"
            and job.salary_min is not None
            and job.salary_max is not None
        ):
            salary_mins.append(job.salary_min)
            salary_maxes.append(job.salary_max)

    ranked_gaps = sorted(
        missing_skill_counts,
        key=lambda skill: (-missing_skill_counts[skill], skill_labels[skill].casefold()),
    )
    top_missing_skills = [
        SkillGap(skill=skill_labels[skill], matching_roles=missing_skill_counts[skill])
        for skill in ranked_gaps[:14]
    ]
    median_salary = None
    if len(salary_mins) >= 5:
        median_salary = SalaryRange(
            sample_size=len(salary_mins),
            median_min=round(median(salary_mins), 2),
            median_max=round(median(salary_maxes), 2),
        )

    return MarketInsights(
        role_count=len(candidates),
        top_missing_skills=top_missing_skills,
        most_common_skill_gap=top_missing_skills[0] if top_missing_skills else None,
        median_salary=median_salary,
    )


@router.post("/resume_documents/{document_id}/recommendations", response_model=RecommendationResponse)
async def get_recommendations(document_id: uuid.UUID, response: Response):
    """Return the top six Jev-scored active jobs for one saved resume."""
    started_at = perf_counter()
    (resume_text, preferences), jobs = await asyncio.gather(
        asyncio.to_thread(_load_resume_context, document_id),
        asyncio.to_thread(load_active_job_catalog),
    )
    catalog_loaded_at = perf_counter()
    if not jobs:
        return RecommendationResponse(
            candidate_count=0,
            scored_count=0,
            input_tokens=0,
            market_insights=MarketInsights(role_count=0),
        )

    candidates = await asyncio.to_thread(retrieve_candidate_jobs, resume_text, preferences, jobs)
    candidates = await asyncio.to_thread(hydrate_candidate_jobs, candidates)
    candidates_selected_at = perf_counter()
    if not candidates:
        return RecommendationResponse(
            candidate_count=0,
            scored_count=0,
            input_tokens=0,
            market_insights=MarketInsights(role_count=0),
        )

    market_insights = await asyncio.to_thread(_build_market_insights, resume_text, candidates)

    try:
        batch_results = await TypeSafeJevClient().score_candidates(resume_text, preferences, candidates)
    except JevConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    recommendations, input_tokens, batch_errors = _merge_ranked_results(candidates, batch_results)
    if not recommendations and batch_errors:
        raise HTTPException(status_code=502, detail="Job scoring is temporarily unavailable. Please try again.")
    response.headers["Server-Timing"] = (
        f"catalog;dur={(catalog_loaded_at - started_at) * 1000:.0f}, "
        f"shortlist;dur={(candidates_selected_at - catalog_loaded_at) * 1000:.0f}, "
        f"jev;dur={(perf_counter() - candidates_selected_at) * 1000:.0f}"
    )
    logger.info(
        "Recommendation timings: catalog=%.0fms shortlist=%.0fms jev=%.0fms candidates=%d",
        (catalog_loaded_at - started_at) * 1000,
        (candidates_selected_at - catalog_loaded_at) * 1000,
        (perf_counter() - candidates_selected_at) * 1000,
        len(candidates),
    )
    return RecommendationResponse(
        recommendations=recommendations,
        candidate_count=len(candidates),
        scored_count=sum(len(batch.scores) for batch in batch_results),
        input_tokens=input_tokens,
        batch_errors=batch_errors,
        market_insights=market_insights,
    )
