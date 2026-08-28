from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.trends import router as trends_router
from api.resume import router as resume_router 

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins = ["*"], allow_methods = ["*"], allow_headers = ["*"],)

app.include_router(trends_router)
app.include_router(resume_router)  
