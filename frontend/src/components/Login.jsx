import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../constants';

// endpoint/identifierField pick which backend login this form talks to: the
// old fixed demo login (username, /v1/auth/login) or a real JWT login backed
// by the `users` table (phone, /v1/auth/hospital/login or /v1/auth/ops/login).
// Both response shapes carry a `role`; a JWT response also carries a `token`.
const Login = ({
  onLogin,
  title = 'MediZen Login',
  subtitle,
  endpoint = '/v1/auth/login',
  identifierLabel = 'Username',
  identifierField = 'username',
}) => {
  const [identifier, setIdentifier] = useState('');
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
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [identifierField]: identifier, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Invalid credentials.');
      }
      const data = await res.json();
      if (data.token) localStorage.setItem('medzen_token', data.token);
      onLogin({ role: data.role.toLowerCase(), hospitalName: data.hospital_name, userName: data.user_name });
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
        <h2 className={`text-2xl font-bold text-center ${subtitle ? 'mb-2' : 'mb-6'}`} style={{ color: 'var(--primary)' }}>{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted mb-6" style={{ textAlign: 'center' }}>{subtitle}</p>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">{identifierLabel}</label>
            <input
              ref={userRef}
              type="text"
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value);
                if (error) setError(false);
              }}
              className={error ? 'border-danger' : ''}
              placeholder={`Enter ${identifierLabel.toLowerCase()}`}
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
