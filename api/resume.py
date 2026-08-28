from fastapi import APIRouter, UploadFile, File, HTTPException
import PyPDF2
import os
from api.db import query
from analysis.skill_extractor import run

router = APIRouter()

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = PyPDF2.PdfReader(file_bytes)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")