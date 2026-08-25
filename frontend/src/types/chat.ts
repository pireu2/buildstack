export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export type StreamEventType =
  | 'token'
  | 'tool_start'
  | 'tool_end'
  | 'error'
  | 'done';

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  tool_name?: string;
  tool_input?: Record<string, any>;
  tool_output?: Record<string, any>;
  error?: string;
}

export interface ChatContext {
  productSlug?: string;
  categorySlug?: string;
  projectDescription?: string;
}
