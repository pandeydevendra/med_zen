import React from 'react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        🏥 MediZen
      </div>
      <nav className="sidebar-nav">
        <a className="nav-item active">New Appointment</a>
        <a className="nav-item">Today's Queue</a>
        <a className="nav-item">Patient Records</a>
        <a className="nav-item">Doctor Rosters</a>
        <a className="nav-item">Settings</a>
      </nav>
    </aside>
  );
};
export default Sidebar;
