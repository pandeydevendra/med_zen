import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import TseOpsOnboarding from './components/TseOpsOnboarding';

// Entry point for /tse_ops — the internal ops tool, built by TSE Pvt Ltd, for
// onboarding facilities onto MediZen. It reuses the same demo login as the
// main app (auth.py) — there is no separate tse_ops credential.
function TseOpsApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    document.title = 'MediZen Ops — TSE Pvt Ltd.';
  }, []);

  if (!isAuthenticated) {
    return (
      <Login
        title="MediZen Ops"
        subtitle="Powered by TSE Pvt Ltd."
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  return <TseOpsOnboarding onLogout={() => setIsAuthenticated(false)} />;
}

export default TseOpsApp;
