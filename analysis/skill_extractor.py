from dotenv import load_dotenv
import os

load_dotenv()

DB = psycopg2.connect(os.environ["DATABASE_URL"])

SKILLS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "scala", "c"

    "react", "vue", "angular", "node.js", "fastapi", "django", "flask",

    "sql", "postgresql", "mysql", "mongodb", "redis",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",

    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",

    "git", "github", "linux", "rest api", "graphql", "kafka", "fastapi"
]

def extract_skills(text):
    text = text.lower()
    return [skill for skill in SKILLS if re.search(rf"\b{re.escape(skill)}\b", text)]

def run():
    with DB.cursor() as cur:
        cur.execute("SELECT id, title FROM postings WHERE skills IS NULL OR skills = '{}'")
        rows = cur.fetchall()