import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    if (userRef.current) userRef.current.focus();
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Invalid username or password.');
      }
      const data = await res.json();
      onLogin(data.role);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Is the backend running?');
      setError(true);
      setTimeout(() => setError(false), 500); // Shake duration
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center" style={{ justifyContent: 'center', backgroundColor: 'var(--secondary)' }}>
      <div className={`card ${error ? 'shake' : ''}`} style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--primary)' }}>MediZen Login</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Username</label>
            <input
              ref={userRef}
              type="text"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                if (error) setError(false);
              }}
              className={error ? 'border-danger' : ''}
              placeholder="Enter username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              className={error ? 'border-danger' : ''}
              placeholder="Enter password"
            />
          </div>

          {errorMsg && (
            <div className="agent-chat-error" style={{ textAlign: 'center' }}>{errorMsg}</div>
          )}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Logging in…' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
