import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import TseOpsOnboarding from './components/TseOpsOnboarding';

// Entry point for /tse_ops — the internal ops tool, built by TSE Pvt Ltd, for
// onboarding facilities onto MediZen. Signs in through the ops JWT login
// (/v1/auth/ops/login, OPS_ADMIN accounts under the PLATFORM tenant); Login
// stores the token in localStorage as `medzen_token` for authenticated calls.
function TseOpsApp() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    document.title = 'MediZen Ops — TSE Pvt Ltd.';
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('medzen_token');
    setSession(null);
  };

  if (!session) {
    return (
      <Login
        title="MediZen Ops"
        subtitle="Powered by TSE Pvt Ltd."
        endpoint="/v1/auth/ops/login"
        identifierField="identifier"
        identifierLabel="Phone or email"
        onLogin={setSession}
      />
    );
  }

  return <TseOpsOnboarding userName={session.userName} onLogout={handleLogout} />;
}

export default TseOpsApp;
