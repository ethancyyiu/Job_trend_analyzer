# Job Trend Analyzer

A real-time job market tracker built by a data science student who wanted to stop guessing what skills are actually in demand.

**Live website:** [marketpulsedata.vercel.app](https://marketpulsedata.vercel.app/)

## What This Project Is

This project collects public LinkedIn job postings, extracts the skills mentioned, stores everything in PostgreSQL, and visualizes hiring trends over time. The pipeline also extracts salary information when it is available, categorizes roles, creates short-term forecasts, and powers a resume-matching tool.

Scrape > Clean > Store > Analyze > Visualize.

## Why I Built It

I didn’t want another tutorial project. I wanted something that:

- uses real data
- updates itself
- forces me to learn scraping, databases, APIs, and frontend
- actually helps me understand the job market

Building this has taught me way more than any course so far.

## Features

### Automated LinkedIn Scraper (Playwright)

- Collects public job listings for remote and Canada-based software, data, analytics, and machine-learning searches
- Saves titles, companies, locations, descriptions, posting dates, salary details, and job URLs into PostgreSQL
- Updates existing postings instead of duplicating the same title, company, and location
- Runs through GitHub Actions twice a day, with a manual-run option too

### Skill Extraction Engine

- Scans job titles and descriptions for a curated list of technical skills
- Stores skills as arrays for easy querying
- Lets me track which skills show up the most over time

### Salary + Category Analysis

- Extracts salary ranges from descriptions when they are listed
- Shows salary coverage, median ranges, yearly versus hourly pay, and category-level medians
- Sorts jobs into software engineer, data engineer, machine learning engineer, data scientist, data analyst, or other

### Forecasting

- Trains a Prophet model on recent posting data after a completed scrape
- Retains every seven-day forecast snapshot for backtesting while serving the latest one quickly
- Includes forecasts for the overall market and available job categories

### FastAPI Backend

- Endpoints for trends, forecasts, top skills, salaries, recent postings, and scrape metadata
- A PDF resume-upload endpoint that finds recognized skills, matching jobs, skill gaps, and salary context

### React + Recharts Frontend

- Charts for posting volume, role categories, forecasts, skills, and salaries
- A recent-postings view with clickable job cards
- A resume analyzer built from the same live market data

### End-to-End Pipeline

Fully automated from scrape > extract > store > analyze > forecast > serve > visualize.

## Tech Stack

- Scraper: Playwright
- Backend: FastAPI + Uvicorn
- Database: PostgreSQL / Supabase
- Frontend: React + Vite + Recharts
- Analysis: pandas, Prophet, keyword-based skill extraction, and Gemini for uncategorized role classification
- Deployment: Vercel (frontend), Render (backend), Supabase (DB)
- GitHub Actions: runs the scraper pipeline twice daily

## Architecture

Playwright Scraper > PostgreSQL > Skill / Salary / Category Analysis > Forecast Cache > FastAPI > React Dashboard

## How To Run It Locally

You’ll need Python 3.12+, Node.js 20+, and a PostgreSQL database with the project’s `postings` table already set up.

### Backend + scraper setup

```bash
python -m pip install -r requirements-dev.txt
playwright install chromium
```

### Frontend setup

```bash
cd frontend
npm install
```

### Environment variables

Copy `.env.example` to `.env` and add your database connection:

```env
DATABASE_URL=postgresql://user:password@host:port/database
VITE_API_URL=http://localhost:8000
GEMINI_API_KEY_PRIMARY=your_primary_gemini_api_key_here
GEMINI_API_KEY_SECONDARY=your_secondary_gemini_api_key_here
```

The Gemini keys are used when the pipeline has to classify job titles that do not match one of the built-in categories or extract salary data. If the primary key is rate-limited, the scraper automatically switches to the secondary key.

### Run the scraper

```bash
python -m scraper.scraper
```

This runs the searches, enriches the saved postings, creates the forecast, and records the completed scrape time. Public job pages can change or rate-limit requests, so the scraper may need maintenance over time.

### Start the backend

```bash
uvicorn api.main:app --reload
```

The API is available at `http://localhost:8000`, and FastAPI docs are at `http://localhost:8000/docs`.

### Start the frontend

```bash
cd frontend
npm run dev
```

## API Endpoints

- `GET /trends` — recent posting volume and job-category trends
- `GET /trends/forecast` — latest cached seven-day forecast
- `GET /skills` — top skills and skill concentration
- `GET /postings` — total posting count and the 50 newest postings
- `GET /salary` — salary coverage, medians, and category salary data
- `GET /metadata` — latest successful scrape time
- `POST /resume_upload` — PDF resume analysis and job matching
- `GET /health` — health check

## Roadmap

- Keep improving the frontend
- Add more model training and prediction
- Provide advice instead of information
- Add better filtering and more useful market views
- Improve skill extraction beyond keyword matching
- Expand the role and location coverage

## Contact + Suggestions

If you have ideas or suggestions, I’m always down to learn. My [LinkedIn](https://www.linkedin.com/in/ethan-yiu-74668b315) is open, message me anytime :)
