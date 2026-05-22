from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
from dotenv import load_dotenv
from api.trends import router

load_dotenv()

app = FastAPI()
app.include_router(router)

app.add_middleware(CORSMiddleware, allow_origins = ["*"], allow_methods = ["*"], allow_headers = ["*"],)

DB = psycopg2.connect(os.environ["DATABASE_URL"])

def query(sql, params=None):
    with DB.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()