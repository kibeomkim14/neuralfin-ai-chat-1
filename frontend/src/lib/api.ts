import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message);
  }
  return response.json();
}

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return handleResponse<T>(response);
}

// API endpoints
export const endpoints = {
  chat: {
    stream: '/api/chat/stream',
    completion: '/api/chat',
  },
} as const;

// API request types
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
});

// API response types
export const ChatResponseSchema = z.object({
  content: z.string(),
  thinking_duration: z.number(),
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Streaming response types
export type StreamResponse = {
  type: 'text-delta' | 'finish' | 'error';
  textDelta?: string;
  error?: string;
}; 