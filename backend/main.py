from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.get("/sum")
def sum_numbers(a: int, b: int):
    print(f" Input: {locals()}")
    result = a + b
    print(f" Result: {result}")   
    return {"a": a, "b": b, "sum": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
