import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, onLogout, role, onRoleChange, page, onNavigate, hospitalName, userName }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-container">
      <Sidebar page={page} onNavigate={onNavigate} role={role} collapsed={collapsed} hospitalName={hospitalName} />
      <main className="main-content">
        <header className="topbar" style={{ backgroundColor: 'var(--warning-light, #fffbeb)' }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setCollapsed(prev => !prev)}
              title={collapsed ? 'Open menu' : 'Collapse menu'}
            >
              {collapsed ? '☰' : '⟨'}
            </button>
            <h2 className="text-xl m-0 text-danger">DEMO ENVIRONMENT</h2>
            <span className="text-muted text-sm ml-2">No real patient data is saved.</span>
          </div>
          <div className="flex items-center gap-4">
            {userName && <span className="text-sm font-semibold">👤 {userName}</span>}
            <select
              value={role}
              onChange={e => onRoleChange?.(e.target.value)}
              className="role-switcher"
              title="Switch demo role"
            >
              <option value="receptionist">Demo Receptionist</option>
              <option value="doctor">Demo Doctor</option>
              <option value="admin">Demo Admin</option>
            </select>
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
