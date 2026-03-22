import React, { useState } from 'react';
import './App.css';
import { BookingProvider } from './context/BookingContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

function App() {
  const [auth, setAuth] = useState({ isAuthenticated: false, role: null });

  if (!auth.isAuthenticated) {
    return <Login onLogin={(role) => setAuth({ isAuthenticated: true, role })} />;
  }

  return (
    <BookingProvider>
      <Layout onLogout={() => setAuth({ isAuthenticated: false, role: null })} role={auth.role}>
        {auth.role === 'admin' ? <AdminDashboard /> : (auth.role === 'doctor' ? <DoctorDashboard /> : <Dashboard />)}
      </Layout>
    </BookingProvider>
  );
}

export default App;
