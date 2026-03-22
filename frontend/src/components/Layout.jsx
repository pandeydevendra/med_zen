import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, onLogout, role }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header className="topbar" style={{ backgroundColor: 'var(--warning-light, #fffbeb)' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-xl m-0 text-danger">DEMO ENVIRONMENT</h2>
            <span className="text-muted text-sm ml-2">No real patient data is saved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted font-semibold">
              {role === 'admin' ? 'Demo Admin' : (role === 'doctor' ? 'Demo Doctor' : 'Demo Receptionist')}
            </span>
            <button className="btn-outline" onClick={onLogout}>Logout</button>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};
export default Layout;
