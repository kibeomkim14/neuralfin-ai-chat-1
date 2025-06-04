#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Running setup..."
    ./setup.sh
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
    echo "Please edit .env file and add your actual OpenAI API key"
    exit 1
fi

# Start the FastAPI server
echo "Starting NEURALFIN.AI Backend..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
