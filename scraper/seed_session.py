# seed_session.py  — run once locally
import json
from dotenv import load_dotenv
load_dotenv()
from api.db import set_state

with open("session.json", "r") as f:
    set_state("linkedin_session", f.read())

print("Session seeded to database.")