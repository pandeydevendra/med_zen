import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const Sidebar = ({ page = 'dashboard', onNavigate, role = 'receptionist', collapsed = false }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/menu?role=${encodeURIComponent(role)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setItems(data.items || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        🏥 MediZen
      </div>
      <nav className="sidebar-nav">
        {items.map(item => (
          <a
            key={item.label}
            className={`nav-item ${item.key && page === item.key ? 'active' : ''}`}
            onClick={item.key ? () => onNavigate?.(item.key) : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
};
export default Sidebar;
