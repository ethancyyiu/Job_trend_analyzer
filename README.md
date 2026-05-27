# Job Trend Analyzer
A real time job market tracker built by a first year data science student who wanted to stop guessing what skills are actually in demand.

# What This Project Is
This project scrapes real LinkedIn job postings, extracts the skills mentioned, stores everything in PostgreSQL, and visualizes hiring trends over time.

Scrape > Clean > Store > Analyze > Visualize.

All automated. All built from scratch.

Link to website: https://marketpulsepro.vercel.app/

# Why I Built It
I didn’t want another tutorial project. I wanted something that:
- uses real data
- updates itself
- forces me to learn scraping, databases, APIs, and frontend
- actually helps me understand the job market

Building this has taught me way more than any course so far.

# Features

## Automated LinkedIn Scraper (Playwright)
- Logs in automatically
- Navigates dynamic JS pages
- Mimics human behavior to avoid bot detection
- Collects thousands of postings in one run
- Saves title, company, location, description, post date, etc. into PostgreSQL

## Skill Extraction Engine
- Scans every job description for 40+ technologies
- Stores skills as arrays for easy querying
- Lets me track which skills show up the most over time

## FastAPI Backend
- Endpoints for trends, top skills, and recent postings

## React + Recharts Frontend
- Line charts for posting volume
- Bar charts for in-demand skills

## End-to-End Pipeline
Fully automated from scrape > extract > store > serve > visualize.
Everything is automated and deployed.
Link to the website: https://marketpulsepro.vercel.app/

# Tech Stack
- Scraper: Playwright
- Backend: FastAPI
- Database: PostgreSQL
- Frontend: React + Recharts
- ML (coming soon): scikit-learn
- Deployment: Vercel (frontend), Render (backend), Supabase (DB)
- Website link: https://marketpulsepro.vercel.app/

# Architecture
Playwright Scraper > PostgreSQL > FastAPI > React Dashboard

# How To Run It Locally

## Backend setup
pip install -r requirements.txt

## Frontend setup
cd frontend
npm install

## Environment variables
Create a .env file for your scraper + backend.

## Run the scraper
python -m scraper.scraper

## Start the backend
uvicorn api.main:app --reload

## Start the frontend
cd frontend
npm run dev

# Roadmap
- Make the frontend look better
- Add ML models to predict hiring trends
- Salary/pay extraction
- Better skill extraction (NLP instead of keyword matching)

# Contact + Suggestions
If you have ideas or suggestions, I’m always down to learn. My linkedin: https://www.linkedin.com/in/ethan-yiu-74668b315  
Message me anytime :)
