import React from 'react';
import { useBooking } from '../context/BookingContext';
import { mockDoctors, mockPatients } from '../mockData';

const AdminDashboard = () => {
  const { appointments } = useBooking();

  return (
    <div className="w-full h-full">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--primary)' }}>Admin Control Center</h2>
      
      <div className="flex gap-6 mb-6">
        <div className="card" style={{ flex: 1, borderTop: '4px solid var(--primary)' }}>
          <h3 className="text-muted text-sm font-bold uppercase tracking-wider">Total Appointments</h3>
          <p className="text-4xl font-bold mt-2">{appointments.length}</p>
        </div>
        <div className="card" style={{ flex: 1, borderTop: '4px solid var(--success)' }}>
          <h3 className="text-muted text-sm font-bold uppercase tracking-wider">Active Staff</h3>
          <p className="text-4xl font-bold mt-2">{mockDoctors.length}</p>
        </div>
        <div className="card" style={{ flex: 1, borderTop: '4px solid #8b5cf6' }}>
          <h3 className="text-muted text-sm font-bold uppercase tracking-wider">Registered Patients</h3>
          <p className="text-4xl font-bold mt-2">{mockPatients.length}</p>
        </div>
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 2 }}>
          <h3 className="text-lg font-semibold mb-4">System Activity Log</h3>
          {appointments.length === 0 ? (
            <p className="text-muted py-4">No recent activity. System is idle.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="font-semibold text-sm">Booking Created:</span> {apt.patient.name} assigned to {apt.doctor.name}
                  </div>
                  <div className="text-xs text-muted font-bold px-2 py-1 rounded bg-secondary">
                    {apt.timestamp || 'Just now'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ flex: 1, position: 'sticky', top: '2rem' }}>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <button className="btn-primary w-full py-3">Manage Doctors</button>
            <button className="btn-outline w-full py-3" style={{ textAlign: 'center' }}>System Settings</button>
            <button className="btn-outline w-full mt-4 py-3" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Flush Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
