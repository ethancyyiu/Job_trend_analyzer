"""Server-side client for TypeSafe Jev System One job-fit scoring."""

from __future__ import annotations

import asyncio
from collections.abc import Sequence
import os
from typing import Any

from dotenv import load_dotenv
import httpx
from pydantic import BaseModel, Field

from api.job_retrieval import CandidateJob
from api.resume import JobPreferences


load_dotenv()

SYSTEM_ONE_URL = "https://api.typesafe.ai/v1/systemone"
JEV_MODEL = "jev-latest"
BATCH_SIZE = 10
MAX_CONCURRENT_BATCHES = 3
FIT_RUBRIC = [
    "0: Not suitable or clearly fails an essential requirement",
    "1: Weak match with limited relevant evidence",
    "2: Partial match with meaningful gaps",
    "3: Strong match for most essential requirements",
    "4: Excellent match for the role and preferences",
]
FIT_INSTRUCTION = (
    "Rate the fit between the candidate and this job based only on stated, "
    "job-relevant evidence. Missing evidence is not evidence of qualification."
)


class JevConfigurationError(RuntimeError):
    """Raised when server-side TypeSafe configuration is incomplete."""


class JevScoreResult(BaseModel):
    job_id: int
    score: int | None = Field(default=None, ge=0, le=4)
    confidence: float | None = Field(default=None, ge=0, le=1)
    input_tokens: int | None = Field(default=None, ge=0)
    error: str | None = None


class JevBatchResult(BaseModel):
    batch_index: int
    job_ids: list[int]
    scores: list[JevScoreResult] = Field(default_factory=list)
    input_tokens: int | None = Field(default=None, ge=0)
    error: str | None = None
    status_code: int | None = None


def _chunks(items: Sequence[CandidateJob], size: int = BATCH_SIZE) -> list[list[CandidateJob]]:
    return [list(items[index:index + size]) for index in range(0, len(items), size)]


def _job_state(candidate: CandidateJob) -> dict[str, Any]:
    job = candidate.job
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "job_category": job.job_category,
        "location": job.location,
        "remote_policy": job.remote_policy,
        "work_authorization": job.work_authorization,
        "salary_type": job.salary_type,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "requirements": job.requirements,
        "nice_to_haves": job.nice_to_haves,
        "responsibilities": job.responsibilities,
        "description": job.description,
        "posting_url": job.posting_url,
    }


class TypeSafeJevClient:
    """Thin, typed HTTP client. It never exposes or serializes the API key."""

    def __init__(
        self,
        api_key: str | None = None,
        endpoint: str = SYSTEM_ONE_URL,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self._api_key = api_key if api_key is not None else os.getenv("TYPESAFE_API_KEY")
        self._endpoint = endpoint
        self._transport = transport

    async def score_candidates(
        self,
        resume_text: str,
        preferences: JobPreferences,
        candidates: Sequence[CandidateJob],
    ) -> list[JevBatchResult]:
        if not self._api_key:
            raise JevConfigurationError("TYPESAFE_API_KEY is not configured on the server.")
        batches = _chunks(candidates)
        if not batches:
            return []

        semaphore = asyncio.Semaphore(MAX_CONCURRENT_BATCHES)
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0), transport=self._transport) as client:
            tasks = [
                self._score_batch(
                    client=client,
                    semaphore=semaphore,
                    batch_index=batch_index,
                    resume_text=resume_text,
                    preferences=preferences,
                    candidates=batch,
                    headers=headers,
                )
                for batch_index, batch in enumerate(batches)
            ]
            return list(await asyncio.gather(*tasks))

    async def _score_batch(
        self,
        client: httpx.AsyncClient,
        semaphore: asyncio.Semaphore,
        batch_index: int,
        resume_text: str,
        preferences: JobPreferences,
        candidates: list[CandidateJob],
        headers: dict[str, str],
    ) -> JevBatchResult:
        job_ids = [candidate.job.id for candidate in candidates]
        questions = {
            f"job_fit_{candidate.job.id}": {
                "type": "score",
                "criteria": FIT_RUBRIC,
                # The ID is deliberately present in the instruction because
                # question-map keys are transport metadata, not model context.
                "instructions": (
                    f"{FIT_INSTRUCTION} The job ID for this question is {candidate.job.id}."
                ),
            }
            for candidate in candidates
        }
        payload = {
            "model": JEV_MODEL,
            "state": {
                "raw_resume_text": resume_text,
                "user_preferences": preferences.model_dump(mode="json"),
                "jobs": [_job_state(candidate) for candidate in candidates],
            },
            "questions": questions,
        }

        async with semaphore:
            response, error = await self._post_with_retry(client, headers, payload)
        if error is not None:
            return JevBatchResult(
                batch_index=batch_index,
                job_ids=job_ids,
                error=error,
                status_code=response.status_code if response is not None else None,
            )

        assert response is not None
        try:
            body = response.json()
        except ValueError:
            return JevBatchResult(
                batch_index=batch_index,
                job_ids=job_ids,
                error="TypeSafe returned a non-JSON response.",
                status_code=response.status_code,
            )

        answers = body.get("answers")
        usage = body.get("usage") or {}
        input_tokens = usage.get("input_tokens")
        if not isinstance(answers, dict):
            return JevBatchResult(
                batch_index=batch_index,
                job_ids=job_ids,
                input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                error="TypeSafe response did not include a valid answers map.",
                status_code=response.status_code,
            )

        results: list[JevScoreResult] = []
        for candidate in candidates:
            answer = answers.get(f"job_fit_{candidate.job.id}")
            if not isinstance(answer, dict):
                results.append(JevScoreResult(
                    job_id=candidate.job.id,
                    input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                    error="TypeSafe did not return a score for this job.",
                ))
                continue
            score = answer.get("score")
            confidence = answer.get("confidence")
            if (
                isinstance(score, bool)
                or not isinstance(score, (int, float))
                or not 0 <= score <= 4
                or not float(score).is_integer()
            ):
                results.append(JevScoreResult(
                    job_id=candidate.job.id,
                    input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                    error="TypeSafe returned an invalid job-fit score.",
                ))
                continue
            confidence_value: float | None = None
            confidence_error = None
            if confidence is not None:
                if isinstance(confidence, bool) or not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
                    confidence_error = "TypeSafe returned an invalid job-fit confidence."
                else:
                    confidence_value = float(confidence)
            results.append(JevScoreResult(
                job_id=candidate.job.id,
                score=int(score),
                confidence=confidence_value,
                input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                error=confidence_error,
            ))
        return JevBatchResult(
            batch_index=batch_index,
            job_ids=job_ids,
            scores=results,
            input_tokens=input_tokens if isinstance(input_tokens, int) else None,
            status_code=response.status_code,
        )

    async def _post_with_retry(
        self,
        client: httpx.AsyncClient,
        headers: dict[str, str],
        payload: dict[str, Any],
    ) -> tuple[httpx.Response | None, str | None]:
        for attempt in range(3):
            try:
                response = await client.post(self._endpoint, headers=headers, json=payload)
            except httpx.RequestError as error:
                if attempt == 2:
                    return None, f"TypeSafe request failed: {error.__class__.__name__}."
                await asyncio.sleep(0.5 * (2 ** attempt))
                continue
            if response.status_code == 429 or response.status_code >= 500:
                if attempt < 2:
                    retry_after = response.headers.get("Retry-After")
                    try:
                        delay = min(float(retry_after), 10.0) if retry_after else 0.5 * (2 ** attempt)
                    except ValueError:
                        delay = 0.5 * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue
            if not response.is_success:
                return response, f"TypeSafe request failed with status {response.status_code}."
            return response, None
        return None, "TypeSafe request failed after retries."
