from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import openai
import os
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="NEURALFIN.AI Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    content: str
    thinking_duration: float

@app.get("/")
async def root():
    return {"message": "NEURALFIN.AI Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "neuralfin-ai-backend"}

async def generate_streaming_response(messages: List[Dict[str, str]]):
    """Generate streaming response from OpenAI"""
    try:
        # System prompt for Sandra
        system_prompt = """You are Sandra, a professional financial advisor from DL Family Office. You provide expert financial advice with a focus on:
        - Portfolio management and asset allocation
        - Retirement planning strategies
        - Risk management and diversification
        - Investment opportunities and market analysis
        - Tax-efficient investing
        - Estate planning considerations
        
        Keep your responses informative yet conversational. Always consider the user's risk tolerance and investment timeline when providing advice. Provide specific, actionable recommendations when possible."""
        
        # Prepare messages for OpenAI
        openai_messages = [{"role": "system", "content": system_prompt}]
        openai_messages.extend([{"role": msg["role"], "content": msg["content"]} for msg in messages])
        
        # Create streaming response
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=openai_messages,
            stream=True,
            max_tokens=1000,
            temperature=0.7
        )
        
        for chunk in response:
            if chunk.choices[0].delta.get("content"):
                content = chunk.choices[0].delta.content
                # Format as Server-Sent Events
                yield f"data: {json.dumps({'type': 'text-delta', 'textDelta': content})}\n\n"
        
        yield f"data: {json.dumps({'type': 'finish'})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat responses from OpenAI"""
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        return StreamingResponse(
            generate_streaming_response(messages),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/plain; charset=utf-8"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_completion(request: ChatRequest):
    """Non-streaming chat completion"""
    try:
        import time
        start_time = time.time()
        
        # System prompt for Sandra
        system_prompt = """You are Sandra, a professional financial advisor from DL Family Office. You provide expert financial advice with a focus on:
        - Portfolio management and asset allocation
        - Retirement planning strategies
        - Risk management and diversification
        - Investment opportunities and market analysis
        - Tax-efficient investing
        - Estate planning considerations
        
        Keep your responses informative yet conversational. Always consider the user's risk tolerance and investment timeline when providing advice. Provide specific, actionable recommendations when possible."""
        
        # Prepare messages for OpenAI
        openai_messages = [{"role": "system", "content": system_prompt}]
        openai_messages.extend([{"role": msg.role, "content": msg.content} for msg in request.messages])
        
        # Get response from OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=openai_messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        thinking_duration = time.time() - start_time
        content = response.choices[0].message.content
        
        return ChatResponse(content=content, thinking_duration=thinking_duration)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
