"""Deterministic extraction of useful job-description sections.

This intentionally uses section headings and text only. It does not call an
LLM or attempt to infer qualifications that a posting did not state.
"""

from __future__ import annotations

import re


_SECTION_HEADINGS = {
    "requirements": ("requirements", "qualifications", "what you bring", "what you'll bring", "must have"),
    "nice_to_haves": ("nice to have", "preferred qualifications", "preferred skills", "bonus points"),
    "responsibilities": ("responsibilities", "what you'll do", "what you will do", "the role", "your impact"),
}
_ALL_HEADINGS = tuple(heading for headings in _SECTION_HEADINGS.values() for heading in headings)


def _section_pattern(headings: tuple[str, ...]) -> re.Pattern[str]:
    alternatives = "|".join(re.escape(heading) for heading in headings)
    following = "|".join(re.escape(heading) for heading in _ALL_HEADINGS)
    return re.compile(
        rf"(?:^|\n)\s*(?:{alternatives})\s*:?\s*(.*?)(?=(?:\n\s*(?:{following})\s*:?)|\Z)",
        flags=re.IGNORECASE | re.DOTALL,
    )


def _clean_lines(text: str) -> list[str]:
    return [
        re.sub(r"^[\s•\-*\d.)]+", "", line).strip()
        for line in text.splitlines()
        if re.sub(r"^[\s•\-*\d.)]+", "", line).strip()
    ]


def extract_job_details(description: str | None) -> dict[str, list[str] | str | None]:
    """Return explicitly headed sections from a job description, when present."""
    source = (description or "").replace("\r\n", "\n")
    sections: dict[str, list[str] | str | None] = {
        "requirements": [],
        "nice_to_haves": [],
        "responsibilities": None,
    }
    for name, headings in _SECTION_HEADINGS.items():
        match = _section_pattern(headings).search(source)
        if not match:
            continue
        lines = _clean_lines(match.group(1))
        if name == "responsibilities":
            sections[name] = "\n".join(lines) or None
        else:
            sections[name] = lines[:40]
    return sections


def ensure_posting_detail_columns(connection) -> None:
    """Apply the additive catalog schema used by the scraper before it writes."""
    with connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE postings
            ADD COLUMN IF NOT EXISTS requirements TEXT[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS nice_to_haves TEXT[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS responsibilities TEXT
        """)
    connection.commit()
