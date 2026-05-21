CREATE TABLE posting (
    id          SERIAL PRIMARY KEY,
    title       TEXT,
    company     TEXT,
    location    TEXT,
    skills      TEXT[],          -- fill later with extractor
    date_scraped DATE,
    UNIQUE (title, company, date_scraped)
);