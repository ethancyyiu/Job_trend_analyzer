"""Job-recommendation endpoint: deterministic retrieval followed by Jev ranking."""

from __future__ import annotations

import asyncio
import logging
from time import perf_counter
import uuid

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from api.db import query
from api.job_retrieval import CandidateJob, hydrate_candidate_jobs, load_active_job_catalog, retrieve_candidate_jobs
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


class RecommendationResponse(BaseModel):
    recommendations: list[JobRecommendation] = Field(default_factory=list, max_length=6)
    candidate_count: int
    scored_count: int
    input_tokens: int
    batch_errors: list[str] = Field(default_factory=list)


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
        return RecommendationResponse(candidate_count=0, scored_count=0, input_tokens=0)

    candidates = await asyncio.to_thread(retrieve_candidate_jobs, resume_text, preferences, jobs)
    candidates = await asyncio.to_thread(hydrate_candidate_jobs, candidates)
    candidates_selected_at = perf_counter()
    if not candidates:
        return RecommendationResponse(candidate_count=0, scored_count=0, input_tokens=0)

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
    )
