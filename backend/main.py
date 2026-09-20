import os
import sys
import uvicorn
from pathlib import Path
from dotenv import load_dotenv
# Ensure print() logs show up immediately (not buffered) even when stdout
# isn't an interactive terminal, e.g. when redirected to a log file.
sys.stdout.reconfigure(line_buffering=True)

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

# Pick the env file with ENV_NAME (local_dev or prod); defaults to local_dev.
ENV_NAME = os.environ.get("ENV_NAME", "local_dev")
load_dotenv(Path(__file__).parent / "env" / f"{ENV_NAME}.env")

from url import router

app = FastAPI()
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "MedZen Doctor Booking Agent", "status_code": status.HTTP_200_OK}


@app.get("/healthceck")
def healthceck():
    return {"status": "ok", "status_code": status.HTTP_200_OK}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
