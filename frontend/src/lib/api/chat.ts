export type StreamEvent = 
  | { type: 'token'; content: string }
  | { type: 'tool_start'; tool: string }
  | { type: 'tool_end'; tool: string }
  | { type: 'done' }
  | { type: 'error'; content: string };

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatApiError extends Error {
  statusCode: number;
  detail?: string;

  constructor(message: string, statusCode: number, detail?: string) {
    super(message);
    this.name = 'ChatApiError';
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000/api/v1/ai';

export async function streamChat(
  prompt: string,
  context: any = null,
  messages: ChatHistoryMessage[] = [],
  onEvent: (event: StreamEvent) => void,
  userId?: string,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(`${AI_SERVICE_URL}/chat/stream`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ prompt, context, messages, user_id: userId }),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || '';
    } catch {
      errorDetail = await response.text().catch(() => '');
    }

    if (response.status === 429) {
      throw new ChatApiError(
        errorDetail || 'You have reached your daily message limit.',
        429,
        errorDetail
      );
    }

    throw new ChatApiError(
      errorDetail || `AI service error (${response.status})`,
      response.status,
      errorDetail
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body missing reader');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      
      const dataStr = trimmed.slice(6).trim();
      if (!dataStr) continue;

      try {
        const event: StreamEvent = JSON.parse(dataStr);
        onEvent(event);
      } catch (e) {
        console.warn('Failed to parse SSE event chunk:', dataStr);
      }
    }
  }
}
