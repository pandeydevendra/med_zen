import React, { useState, useEffect, useRef } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    if (userRef.current) userRef.current.focus();
  }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (username.toLowerCase() === 'demo' && password.toLowerCase() === 'demo') {
      onLogin('receptionist');
    } else if (username.toLowerCase() === 'doctor' && password.toLowerCase() === 'doctor') {
      onLogin('doctor');
    } else if (username.toLowerCase() === 'admin' && password.toLowerCase() === 'admin') {
      onLogin('admin');
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); // Shake duration
    }
  };

  const handleDemoClick = (roleString) => {
    setUsername(roleString);
    setPassword(roleString);
    // small timeout to show UI updating before routing
    setTimeout(() => {
      onLogin(roleString === 'demo' ? 'receptionist' : 'doctor');
    }, 150);
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
          
          <button type="submit" className="btn-primary w-full mt-2" style={{ height: '50px' }}>
            LOGIN
          </button>
        </form>

        <div className="mt-8 p-4 rounded" style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-muted mb-2">👋 Want to try the system?</span>
            <button 
              type="button"
              className="btn-outline w-full font-semibold" 
              style={{ backgroundColor: 'white', color: 'var(--primary)', borderColor: 'var(--primary)' }}
              onClick={() => handleDemoClick('demo')}
            >
              Try Demo Receptionist (1-Click)
            </button>
            <button 
              type="button"
              className="btn-outline w-full font-semibold mt-2" 
              style={{ backgroundColor: 'white', color: 'var(--success)', borderColor: 'var(--success)' }}
              onClick={() => handleDemoClick('doctor')}
            >
              Try Demo Doctor (1-Click)
            </button>
            <button 
              type="button"
              className="btn-outline w-full font-semibold mt-2" 
              style={{ backgroundColor: 'white', color: '#8b5cf6', borderColor: '#8b5cf6' }}
              onClick={() => handleDemoClick('admin')}
            >
              Try Demo Admin (1-Click)
            </button>
            <div className="text-xs text-muted mt-3 text-center" style={{ lineHeight: '1.6' }}>
              Receptionist: <strong>demo</strong> / <strong>demo</strong><br/>
              Doctor: <strong>doctor</strong> / <strong>doctor</strong><br/>
              Admin: <strong>admin</strong> / <strong>admin</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
