import { test } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Provider-agnostic AI module unit tests (network is mocked; no real key used)
// ---------------------------------------------------------------------------
const ai = await import('../backend/ai.ts');

function withMockFetch(handler: (url: string, init: any) => Response, fn: () => Promise<void>) {
  const original = globalThis.fetch;
  const calls: { url: string; body: any; headers: any }[] = [];
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null, headers: init?.headers || {} });
    return handler(String(url), init);
  }) as any;
  return fn().finally(() => { globalThis.fetch = original; }).then(() => calls);
}

test('AI is disabled until AI_PROVIDER and AI_API_KEY are both set', async () => {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  assert.equal(ai.isAiConfigured(), false);
  const result = await ai.aiChat('system', [{ role: 'user', content: 'hi' }]);
  assert.equal(result.ok, false);
  assert.match(result.error || '', /not configured/i);
});

test('Gemini request is shaped correctly and its response is parsed', async () => {
  process.env.AI_PROVIDER = 'gemini';
  process.env.AI_API_KEY = 'test-key';
  delete process.env.AI_MODEL;
  assert.equal(ai.isAiConfigured(), true);
  const calls = await withMockFetch(
    () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }] }), { status: 200 }),
    async () => {
      const r = await ai.aiChat('sys prompt', [{ role: 'user', content: 'hi' }]);
      assert.equal(r.ok, true);
      assert.equal(r.text, 'Hello from Gemini');
      assert.equal(r.provider, 'gemini');
      assert.equal(r.model, 'gemini-2.0-flash');
    }
  );
  assert.match(calls[0].url, /generativelanguage\.googleapis\.com/);
  assert.match(calls[0].url, /gemini-2\.0-flash/);
  assert.match(calls[0].url, /key=test-key/);
  assert.equal(calls[0].body.systemInstruction.parts[0].text, 'sys prompt');
});

test('OpenAI-compatible request is shaped correctly and its response is parsed', async () => {
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://example.test/v1';
  process.env.AI_MODEL = 'my-model';
  const calls = await withMockFetch(
    () => new Response(JSON.stringify({ choices: [{ message: { content: 'Hello from OpenAI' } }] }), { status: 200 }),
    async () => {
      const r = await ai.aiChat('sys', [{ role: 'user', content: 'hi' }]);
      assert.equal(r.ok, true);
      assert.equal(r.text, 'Hello from OpenAI');
    }
  );
  assert.equal(calls[0].url, 'https://example.test/v1/chat/completions');
  assert.equal(calls[0].headers['Authorization'], 'Bearer test-key');
  assert.equal(calls[0].body.model, 'my-model');
  assert.equal(calls[0].body.messages[0].role, 'system');
  delete process.env.AI_BASE_URL;
  delete process.env.AI_MODEL;
});

test('Anthropic request is shaped correctly and its response is parsed', async () => {
  process.env.AI_PROVIDER = 'anthropic';
  process.env.AI_API_KEY = 'test-key';
  delete process.env.AI_MODEL;
  const calls = await withMockFetch(
    () => new Response(JSON.stringify({ content: [{ text: 'Hello from Claude' }] }), { status: 200 }),
    async () => {
      const r = await ai.aiChat('sys', [{ role: 'user', content: 'hi' }]);
      assert.equal(r.ok, true);
      assert.equal(r.text, 'Hello from Claude');
      assert.equal(r.model, 'claude-3-5-sonnet-latest');
    }
  );
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0].headers['x-api-key'], 'test-key');
  assert.equal(calls[0].body.system, 'sys');
});

test('a provider HTTP error is reported without throwing', async () => {
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_API_KEY = 'test-key';
  await withMockFetch(
    () => new Response('nope', { status: 401 }),
    async () => {
      const r = await ai.aiChat('sys', [{ role: 'user', content: 'hi' }]);
      assert.equal(r.ok, false);
      assert.match(r.error || '', /HTTP 401/);
    }
  );
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
});

// ---------------------------------------------------------------------------
// Endpoint tests (handlers invoked directly, as the other server tests do)
// ---------------------------------------------------------------------------
process.env.CRM_TEST_MODE = 'true';
const { app } = await import('../server');

async function call(method: string, url: string, body: any = {}) {
  const layer = (app as any)._router.stack.find(
    (l: any) => l.route && (Array.isArray(l.route.path) ? l.route.path.includes(url) : l.route.path === url) && l.route.methods[method.toLowerCase()]
  );
  assert.ok(layer, `${method} ${url} exists`);
  let code = 200;
  let result: any;
  const res: any = { status(n: number) { code = n; return this; }, json(v: any) { result = v; return this; }, send(v: any) { result = v; return this; }, type() { return this; } };
  await layer.route.stack[0].handle({ body, params: {}, query: {}, protocol: 'http', headers: {}, get: () => 'localhost:3000' }, res);
  return { code, body: result };
}

test('/api/ai/status reports unconfigured when no provider key is set', async () => {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  const r = await call('GET', '/api/ai/status');
  assert.equal(r.code, 200);
  assert.equal(r.body.configured, false);
});

test('/api/ai/assistant degrades cleanly (503) when AI is not configured', async () => {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  const r = await call('POST', '/api/ai/assistant', { messages: [{ role: 'user', content: 'How much is overdue?' }] });
  assert.equal(r.code, 503);
  assert.equal(r.body.configured, false);
});

test('/api/ai/assistant returns a grounded answer when configured', async () => {
  process.env.AI_PROVIDER = 'gemini';
  process.env.AI_API_KEY = 'test-key';
  await withMockFetch(
    (_url, init) => {
      // echo back that the business summary was included in the system prompt
      const hasSummary = JSON.stringify(init.body).includes('Total outstanding receivable');
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: hasSummary ? 'Grounded answer' : 'No context' }] } }] }), { status: 200 });
    },
    async () => {
      const r = await call('POST', '/api/ai/assistant', { messages: [{ role: 'user', content: 'summarise receivables' }] });
      assert.equal(r.code, 200);
      assert.equal(r.body.success, true);
      assert.equal(r.body.answer, 'Grounded answer');
      assert.equal(typeof r.body.metrics.totalOutstanding, 'number');
    }
  );
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
});
