import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const SUGGESTIONS = [
  'List all doctors',
  'Is Dr. Rao available on Monday?',
  'When is Dr. Patil free?',
  'Which doctors work on Saturday?',
];

function getSessionId() {
  try {
    let id = sessionStorage.getItem('medizen_agent_session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('medizen_agent_session', id);
    }
    return id;
  } catch {
    return `session-${Date.now()}`;
  }
}

const DoctorAgentChat = () => {
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the MediZen assistant. Ask me about doctor availability, specialties, locations, or fees." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendQuestion = async (question) => {
    const q = question.trim();
    if (!q || loading) return;
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: q }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const handleReset = async () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared. Ask me anything about doctor availability!' }]);
    setError('');
    try {
      await fetch(`${API_BASE}/api/agent/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // best-effort; local chat is already cleared
    }
  };

  return (
    <div className="card agent-chat">
      <div className="agent-chat-header">
        <div className="flex items-center gap-2">
          <span className="agent-chat-avatar">🤖</span>
          <div>
            <h3 className="text-lg font-semibold m-0">MediZen AI Assistant</h3>
            <span className="text-muted text-sm">Ask about doctor availability, specialties & fees</span>
          </div>
        </div>
        <button className="btn-outline" onClick={handleReset}>Clear chat</button>
      </div>

      <div className="agent-chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`agent-bubble-row ${m.role}`}>
            <div className={`agent-bubble ${m.role}`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="agent-bubble-row assistant">
            <div className="agent-bubble assistant agent-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="agent-chat-error">{error}</div>}

      <div className="agent-chat-suggestions">
        {SUGGESTIONS.map(s => (
          <button key={s} className="agent-chip" onClick={() => sendQuestion(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>

      <form className="agent-chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your question…"
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default DoctorAgentChat;
