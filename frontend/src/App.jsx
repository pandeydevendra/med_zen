import React, { useState } from 'react';
import './App.css';
import { BookingProvider } from './context/BookingContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import DoctorAgentPage from './components/DoctorAgentPage';
import HelpDocs from './components/HelpDocs';

function App() {
  const [auth, setAuth] = useState({ isAuthenticated: false, role: null, hospitalName: null, userName: null });
  const [page, setPage] = useState('dashboard');

  if (!auth.isAuthenticated) {
    return (
      <Login
        endpoint="/v1/auth/hospital/login"
        identifierLabel="Phone or Email"
        identifierField="identifier"
        onLogin={({ role, hospitalName, userName }) => setAuth({ isAuthenticated: true, role, hospitalName, userName })}
      />
    );
  }

  return (
    <BookingProvider>
      <Layout
        onLogout={() => setAuth({ isAuthenticated: false, role: null, hospitalName: null, userName: null })}
        role={auth.role}
        onRoleChange={(role) => setAuth(prev => ({ ...prev, role }))}
        hospitalName={auth.hospitalName}
        userName={auth.userName}
        page={page}
        onNavigate={setPage}
      >
        {page === 'agent'
          ? <DoctorAgentPage />
          : page === 'help'
          ? <HelpDocs />
          : (auth.role === 'admin' ? <AdminDashboard /> : (auth.role === 'doctor' ? <DoctorDashboard /> : <Dashboard />))}
      </Layout>
    </BookingProvider>
  );
}

export default App;
