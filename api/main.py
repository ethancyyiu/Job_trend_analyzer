from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
from dotenv import load_dotenv

app = fastAPI()

load_dotenv()

app.add_middleware(CORSMiddleware, allow_origins = ["*"], allow_methods = ["*"], allow_headers = ["*"],)

DB = psycopg2.connect(os.environ["DATABASE_URL"])