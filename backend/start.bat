@echo off
echo Setting up NEURALFIN.AI Python Backend for Windows...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file...
    echo OPENAI_API_KEY=your_openai_api_key_here > .env
    echo Please edit .env file and add your actual OpenAI API key
    pause
    exit /b 1
)

REM Start the FastAPI server
echo Starting NEURALFIN.AI Backend...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
