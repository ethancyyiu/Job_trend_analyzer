from dotenv import load_dotenv
import os
import psycopg2
import re

load_dotenv()

SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "scala", "c", "html", "css",

    "react", "vue", "angular", "node.js", "fastapi", "django", "flask", "nestjs", "power bi",

    "sql", "postgresql", "mysql", "mongodb", "redis",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",

    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",

    "git", "github", "linux", "rest api", "graphql", "kafka", "fastapi", "fast api", "restapi", "nosql",
    
    "r", "tableau", "excel", "machine learning", "ci/cd", "cicd", "jenkins", "github actions", 
    
    "spark", "snowflake", "databricks", "langchain", "xgboost", "lightgbm", "springboot", 
    
    "express.js", "prometheus", "sas", "matlab", "bash", "shell scripting", "pyspark", "rag", "langgraph", "snowflake", "MCP"
]

def extract_skills(text):
    text = text.lower()
    return [skill for skill in SKILLS if re.search(rf"\b{re.escape(skill)}\b", text)]

def run():
    DB = psycopg2.connect(os.environ["DATABASE_URL"])
    with DB.cursor() as cur:
        cur.execute("SELECT id, title, description FROM postings WHERE skills IS NULL OR skills = '{}'")
        rows = cur.fetchall()
        print(f"Processing {len(rows)} postings...")

        for row_id, title, description in rows:
            combined = f"{title} {description}"
            found = extract_skills(combined)
            cur.execute(
                "UPDATE postings SET skills = %s WHERE id = %s",
                (found, row_id)
            )

        DB.commit()
        print("all done!")

if __name__ == "__main__":
    run()