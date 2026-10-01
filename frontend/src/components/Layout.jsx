import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, onLogout, role, onRoleChange, page, onNavigate, hospitalName, userName }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-container">
      <Sidebar page={page} onNavigate={onNavigate} role={role} collapsed={collapsed} hospitalName={hospitalName} />
      <main className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setCollapsed(prev => !prev)}
              title={collapsed ? 'Open menu' : 'Collapse menu'}
            >
              {collapsed ? '☰' : '⟨'}
            </button>
            <h2 className="text-xl m-0">{hospitalName || 'MediZen'}</h2>
            <span className="text-muted desk-small" style={{ marginLeft: '0.5rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userName && <span className="text-sm font-semibold">👤 {userName}</span>}
            <select
              value={role}
              onChange={e => onRoleChange?.(e.target.value)}
              className="role-switcher"
              title="Switch view"
            >
              <option value="receptionist">Booking desk</option>
              <option value="doctor">Doctor queue</option>
              <option value="admin">Admin overview</option>
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
