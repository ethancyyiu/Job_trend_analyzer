"""Typed job-catalog interface shared by retrieval and scoring endpoints."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Literal

from pydantic import BaseModel, Field, computed_field

from api.db import query


SalaryType = Literal["hourly", "yearly"]


class JobRecord(BaseModel):
    id: int
    title: str
    company: str | None = None
    job_category: str | None = None
    location: str | None = None
    salary_type: SalaryType | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    requirements: list[str] = Field(default_factory=list)
    nice_to_haves: list[str] = Field(default_factory=list)
    responsibilities: str | None = None
    description: str | None = None
    date_posted: date | None = None
    posting_url: str | None = None
    skills: list[str] = Field(default_factory=list)
    remote_policy: Literal["remote", "hybrid", "on_site"] | None = None
    work_authorization: Literal["no_sponsorship", "sponsorship_available"] | None = None

    @computed_field
    @property
    def is_active(self) -> bool:
        """A recommendation is active only when posted in the last seven days."""
        return self.date_posted is not None and self.date_posted >= date.today() - timedelta(days=7)


def ensure_job_catalog_schema() -> None:
    """Make the posting catalog compatible with typed recommendation records."""
    query("""
        ALTER TABLE postings
        ADD COLUMN IF NOT EXISTS requirements TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS nice_to_haves TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS responsibilities TEXT
    """)
