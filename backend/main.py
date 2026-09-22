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
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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
        "https://med-zen.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In production the built frontend (frontend/dist) is served from "/" next to the
# API under "/api". Without a build, "/" just returns a welcome message.
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
FRONTEND_INDEX = FRONTEND_DIST / "index.html"

if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/", include_in_schema=False)
def read_root():
    if FRONTEND_INDEX.is_file():
        return FileResponse(FRONTEND_INDEX)
    return {"message": "MedZen Doctor Booking Agent", "status_code": status.HTTP_200_OK}


# The tse_ops UI (hospital onboarding) is the same single-page app, routed
# client-side by main.jsx based on the URL path. Serve it the same index.html
# so a direct visit or refresh at /tse_ops doesn't 404.
@app.get("/tse_ops", include_in_schema=False)
@app.get("/tse_ops/", include_in_schema=False)
def read_tse_ops():
    return read_root()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
