export interface SolutionProductItem {
  name: string;
  slug: string;
  category: string;
  role: string;
  unit_price: number;
  unit: string;
}

export interface SolutionOption {
  id: 'budget' | 'balanced' | 'premium';
  tier: 'budget' | 'balanced' | 'premium';
  title: string;
  tagline: string;
  description: string;
  pricing: {
    cost_per_m2: number;
    total_estimated_cost: number;
    currency: string;
  };
  products: SolutionProductItem[];
  key_benefits: string[];
  installation_notes: string[];
}

export interface GeneratePlansResponse {
  success: boolean;
  query: string;
  dimensions: {
    length_m: number;
    height_m: number;
    area_m2: number;
  };
  options: SolutionOption[];
}

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000/api/v1/ai';

export async function fetchDynamicQuestions(
  prompt: string,
  staticParams: { budget?: string; moisture_level?: string; priority?: string } = {}
): Promise<string[]> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/solutions/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, static_params: staticParams }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate questions (${res.status})`);
    }

    const data = await res.json();
    return data.questions || [];
  } catch (error) {
    console.error('fetchDynamicQuestions error:', error);
    return [];
  }
}

export async function generateSolutionPlans(payload: {
  prompt: string;
  budget?: string;
  moisture_level?: string;
  dimensions?: { length_m: number; height_m: number };
  answers?: Array<{ question: string; answer: string }>;
}): Promise<GeneratePlansResponse | null> {
  const res = await fetch(`${AI_SERVICE_URL}/solutions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 429) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          'Daily plan generation limit reached. Sign in to generate up to 10 solutions per day, or try again in 24 hours.'
      );
    }
    throw new Error(`Failed to generate plans (${res.status})`);
  }

  return await res.json();
}

export async function streamSolutionsChat({
  prompt,
  context,
  messages,
  onChunk,
  onDone,
  onError,
}: {
  prompt: string;
  context: {
    query?: string;
    dimensions?: any;
    options?: SolutionOption[];
    selected_option?: SolutionOption;
  };
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onChunk: (token: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/solutions/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context, messages }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            'Daily consultation message limit reached. Sign in for more messages or try again in 24 hours.'
        );
      }
      throw new Error(`Chat stream error: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              onChunk(data.content);
            } else if (data.type === 'done') {
              onDone();
              return;
            } else if (data.type === 'error') {
              onError(data.content);
              return;
            }
          } catch {
            // ignore malformed line
          }
        }
      }
    }
    onDone();
  } catch (error: any) {
    onError(error.message || 'Stream connection failed');
  }
}
