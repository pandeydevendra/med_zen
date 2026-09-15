from fastapi import FastAPI, status

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "MedZen Doctor Booking Agent", "status_code": status.HTTP_200_OK}


@app.get("/healthceck")
def healthceck():
    return {"status": "ok", "status_code": status.HTTP_200_OK}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
