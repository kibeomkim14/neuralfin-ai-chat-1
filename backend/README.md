# NEURALFIN.AI Backend

Python FastAPI backend for the NEURALFIN.AI financial advisor chat interface.

## Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

#### For macOS/Linux:
\`\`\`bash
# Make scripts executable
chmod +x setup.sh start.sh

# Run setup (creates virtual environment and installs dependencies)
./setup.sh

# Add your OpenAI API key to .env file
nano .env

# Start the server
./start.sh
\`\`\`

#### For Windows:
\`\`\`cmd
# Run the setup script
start.bat
\`\`\`

#### Manual Setup:
\`\`\`bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your OpenAI API key
cp .env.example .env
# Edit .env file with your actual API key

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/chat` - Non-streaming chat completion
- `POST /api/chat/stream` - Streaming chat completion

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `ENVIRONMENT` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/warning/error)

## Development

The server runs on `http://localhost:8000` by default.

API documentation is available at `http://localhost:8000/docs` when the server is running.
