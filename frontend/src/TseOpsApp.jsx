import React, { useState } from 'react';
import Login from './components/Login';
import TseOpsOnboarding from './components/TseOpsOnboarding';

// Entry point for /tse_ops, MediZen's internal hospital-onboarding tool.
// It reuses the same demo login as the main app (auth.py) — there is no
// separate tse_ops credential.
function TseOpsApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <TseOpsOnboarding onLogout={() => setIsAuthenticated(false)} />;
}

export default TseOpsApp;
