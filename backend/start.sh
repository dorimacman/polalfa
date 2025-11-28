#!/bin/bash
# PolAlfa Backend Startup Script

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start uvicorn server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
