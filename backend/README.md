# MedZen Backend

This is the FastAPI backend for MedZen.

## Setup Instructions

1. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000). You can also view the interactive API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
