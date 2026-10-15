/**
 * Provider-agnostic AI helper for Enact360.
 *
 * One small, dependency-free client that talks to Gemini, any OpenAI-compatible endpoint
 * (OpenAI, Azure OpenAI, OpenRouter, a local Ollama/vLLM server, …) or Anthropic. Configure it
 * entirely through environment variables so no provider is baked into the code and no key is ever
 * committed:
 *
 *   AI_PROVIDER   gemini | openai | anthropic           (required to enable AI)
 *   AI_API_KEY    the provider API key                  (required to enable AI)
 *   AI_MODEL      model id                              (optional; a sensible default per provider)
 *   AI_BASE_URL   override the API base URL             (optional; e.g. Azure/OpenRouter/self-host)
 *
 * When AI_PROVIDER/AI_API_KEY are not set the app runs exactly as before and every AI endpoint
 * returns a clean "not configured" response — nothing breaks, nothing is attempted.
 */

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

export interface AiConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiResult {
  ok: boolean;
  text: string;
  provider: string;
  model: string;
  error?: string;
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
};

const SUPPORTED: AiProvider[] = ['gemini', 'openai', 'anthropic'];

export function aiConfig(): AiConfig {
  const provider = String(process.env.AI_PROVIDER || '').trim().toLowerCase();
  const apiKey = String(process.env.AI_API_KEY || '').trim();
  const model =
    String(process.env.AI_MODEL || '').trim() ||
    (SUPPORTED.includes(provider as AiProvider) ? DEFAULT_MODELS[provider as AiProvider] : '');
  const baseUrl = String(process.env.AI_BASE_URL || '').trim();
  return { provider, apiKey, model, baseUrl };
}

export function isAiConfigured(): boolean {
  const c = aiConfig();
  return Boolean(c.provider && c.apiKey && SUPPORTED.includes(c.provider as AiProvider));
}

function defaultBase(provider: AiProvider): string {
  if (provider === 'gemini') return 'https://generativelanguage.googleapis.com';
  if (provider === 'openai') return 'https://api.openai.com/v1';
  return 'https://api.anthropic.com';
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send a system prompt + conversation to the configured provider and return the assistant text.
 * Never throws for a normal provider error — it returns { ok:false, error } so callers can respond
 * with a clean message. Only programming errors propagate.
 */
export async function aiChat(
  system: string,
  messages: AiMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<AiResult> {
  const cfg = aiConfig();
  const provider = cfg.provider as AiProvider;
  const base = (cfg.baseUrl || defaultBase(provider)).replace(/\/+$/, '');
  const maxTokens = opts.maxTokens ?? 1024;
  const temperature = opts.temperature ?? 0.2;

  if (!isAiConfigured()) {
    return { ok: false, text: '', provider: cfg.provider, model: cfg.model, error: 'AI is not configured.' };
  }

  try {
    let url: string;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body: unknown;

    if (provider === 'gemini') {
      url = `${base}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
      body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      };
    } else if (provider === 'openai') {
      url = `${base}/chat/completions`;
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
      body = {
        model: cfg.model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
      };
    } else {
      url = `${base}/v1/messages`;
      headers['x-api-key'] = cfg.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = { model: cfg.model, system, messages, max_tokens: maxTokens, temperature };
    }

    const response = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const raw = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        text: '',
        provider,
        model: cfg.model,
        error: `Provider returned HTTP ${response.status}.`,
      };
    }

    let text = '';
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch { /* ignore */ }

    if (provider === 'gemini') {
      text = (parsed?.candidates?.[0]?.content?.parts || []).map((p: any) => p?.text || '').join('').trim();
    } else if (provider === 'openai') {
      text = String(parsed?.choices?.[0]?.message?.content || '').trim();
    } else {
      text = (parsed?.content || []).map((c: any) => c?.text || '').join('').trim();
    }

    if (!text) {
      return { ok: false, text: '', provider, model: cfg.model, error: 'The AI provider returned an empty response.' };
    }
    return { ok: true, text, provider, model: cfg.model };
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'The AI request timed out.' : 'The AI provider could not be reached.';
    return { ok: false, text: '', provider, model: cfg.model, error: message };
  }
}
