# NeuralFin AI Chat

A fullstack AI chat application built with Next.js and FastAPI.

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+
- OpenAI API key

## Setup

1. Install dependencies for all parts of the application:
```bash
pnpm install:all
```

2. Configure environment variables:
   - Backend: Create a `.env` file in the `backend` directory with your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```
   - Frontend: Create a `.env` file in the `frontend` directory:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```

## Development

To run the fullstack application in development mode:

```bash
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Production Build

To build the frontend for production:

```bash
pnpm build
```

To start the production server:

```bash
pnpm start
```

## Project Structure

- `frontend/`: Next.js application
- `backend/`: FastAPI application
