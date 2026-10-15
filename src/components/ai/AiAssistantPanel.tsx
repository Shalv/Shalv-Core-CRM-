import React, { useEffect, useState } from 'react';
import { Sparkles, X, Send, Loader2, Lightbulb, Mail, MessageSquare } from 'lucide-react';

type Tab = 'assistant' | 'insights' | 'draft';
type Msg = { role: 'user' | 'assistant'; content: string };
type AiStatus = { configured: boolean; provider: string | null; model: string | null };

/**
 * Floating AI assistant for the CRM. Self-contained: it calls the authenticated /api/ai/* endpoints
 * (session travels in the HttpOnly cookie) and shows a friendly "not configured" note when the
 * server has no AI key, so it never breaks the app when AI is turned off.
 */
export function AiAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('assistant');
  const [status, setStatus] = useState<AiStatus | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [insights, setInsights] = useState('');

  const [draftKind, setDraftKind] = useState('follow_up');
  const [draftRecipient, setDraftRecipient] = useState('');
  const [draftAbout, setDraftAbout] = useState('');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open || status) return;
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((d) => setStatus({ configured: !!d.configured, provider: d.provider || null, model: d.model || null }))
      .catch(() => setStatus({ configured: false, provider: null, model: null }));
  }, [open, status]);

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.message || `Request failed (${res.status})`);
    return data as any;
  };

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const data = await post('/api/ai/assistant', { messages: next });
      setMessages([...next, { role: 'assistant', content: data.answer || '' }]);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const loadInsights = async () => {
    setBusy(true);
    setError('');
    setInsights('');
    try {
      const data = await post('/api/ai/insights', {});
      setInsights(data.insights || '');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const makeDraft = async () => {
    if (!draftRecipient.trim() && !draftAbout.trim()) {
      setError('Add a recipient or a short brief first.');
      return;
    }
    setBusy(true);
    setError('');
    setDraft('');
    try {
      const data = await post('/api/ai/draft', { kind: draftKind, recipient: draftRecipient, about: draftAbout });
      setDraft(data.draft || '');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const tabBtn = (id: Tab, label: string, Icon: any) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
        tab === id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="AI Assistant"
        aria-label="AI Assistant"
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[380px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">AI Assistant</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {status?.configured ? status.model || status.provider : 'not configured'}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-2 border-b border-slate-100">
            {tabBtn('assistant', 'Assistant', MessageSquare)}
            {tabBtn('insights', 'Insights', Lightbulb)}
            {tabBtn('draft', 'Draft', Mail)}
          </div>

          {status && !status.configured && (
            <div className="px-4 py-3 text-[12px] text-amber-800 bg-amber-50 border-b border-amber-100">
              AI is turned off on this server. An administrator can enable it by setting
              <code className="mx-1 px-1 rounded bg-amber-100">AI_PROVIDER</code> and
              <code className="mx-1 px-1 rounded bg-amber-100">AI_API_KEY</code>.
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ maxHeight: 360, minHeight: 200 }}>
            {tab === 'assistant' && (
              <>
                {messages.length === 0 && (
                  <p className="text-[12px] text-slate-500">
                    Ask about receivables, overdue customers, pipeline, invoices, GST or collections. Answers use your live CRM data.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-[12px] leading-relaxed rounded-xl px-3 py-2 whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-indigo-50 text-slate-800 ml-6' : 'bg-slate-50 text-slate-800 mr-6'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {busy && <div className="flex items-center gap-2 text-[12px] text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</div>}
              </>
            )}

            {tab === 'insights' && (
              <>
                <button
                  onClick={loadInsights}
                  disabled={busy || !status?.configured}
                  className="w-full mb-2 py-2 rounded-lg bg-indigo-600 text-white text-[12px] font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
                >
                  Generate business insights
                </button>
                {insights && <div className="text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap bg-slate-50 rounded-xl px-3 py-2">{insights}</div>}
              </>
            )}

            {tab === 'draft' && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={draftKind}
                    onChange={(e) => setDraftKind(e.target.value)}
                    className="text-[12px] border border-slate-200 rounded-lg px-2 py-1.5"
                  >
                    <option value="follow_up">Follow-up</option>
                    <option value="payment_reminder">Payment reminder</option>
                    <option value="introduction">Introduction</option>
                    <option value="thank_you">Thank you</option>
                  </select>
                  <input
                    value={draftRecipient}
                    onChange={(e) => setDraftRecipient(e.target.value)}
                    placeholder="Recipient"
                    className="text-[12px] border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                </div>
                <textarea
                  value={draftAbout}
                  onChange={(e) => setDraftAbout(e.target.value)}
                  placeholder="Short brief (e.g. overdue invoice CSINV-00012, ₹2,40,000, request payment this week)"
                  rows={3}
                  className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mb-2 resize-none"
                />
                <button
                  onClick={makeDraft}
                  disabled={busy || !status?.configured}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white text-[12px] font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
                >
                  Draft email
                </button>
                {draft && <div className="mt-2 text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap bg-slate-50 rounded-xl px-3 py-2">{draft}</div>}
              </>
            )}

            {error && <div className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          </div>

          {tab === 'assistant' && (
            <div className="border-t border-slate-100 p-2 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask the assistant…"
                className="flex-1 text-[12px] border border-slate-200 rounded-lg px-3 py-2"
              />
              <button
                onClick={send}
                disabled={busy || !status?.configured}
                className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 transition"
                aria-label="Send"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
