import React from 'react';
import { STATUS_LABEL, formatTime, useBooking } from '../context/BookingContext';
import ModifyAppointments from './ModifyAppointments';

const StatCard = ({ label, value, color }) => (
  <div className="card desk-stat" style={{ borderTop: `4px solid ${color}` }}>
    <div className="desk-stat-label">{label}</div>
    <div className="desk-stat-value">{value}</div>
  </div>
);

const formatClock = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

// Admin view of the selected day: totals, every appointment with its status
// (and the same actions as the front desk), and a log of who booked what.
const AdminDashboard = () => {
  const { date, setDate, doctors, appointments, appointmentsLoading, queue } = useBooking();
  const show = (n) => (appointmentsLoading ? '—' : n);
  const log = [...appointments].sort((a, b) => String(b.booked_at).localeCompare(String(a.booked_at)));

  return (
    <div className="w-full h-full">
      <div className="desk-card-head mb-4">
        <h2 className="text-2xl m-0" style={{ color: 'var(--primary)' }}>Admin Control Center</h2>
        <label className="desk-date">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      <div className="desk-stats mb-4">
        <StatCard label="Appointments" value={show(queue.total)} color="var(--primary)" />
        <StatCard label="Waiting" value={show(queue.waiting)} color="#f59e0b" />
        <StatCard label="Completed" value={show(queue.completed)} color="var(--success)" />
        <StatCard label="Bookable doctors" value={doctors.length} color="#8b5cf6" />
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        <div className="flex flex-col gap-6" style={{ flex: 2, minWidth: 0 }}>
          <ModifyAppointments title="All appointments" />

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Booking Activity</h3>
            {log.length === 0 ? (
              <p className="text-muted">No bookings for this day yet.</p>
            ) : (
              <div className="flex flex-col">
                {log.map((apt) => (
                  <div key={apt.appointment_uid} className="desk-log-row">
                    <div>
                      <span className="font-semibold">{apt.patient.full_name}</span> booked with {apt.doctor.name} at {formatTime(apt.time)}
                      {apt.booked_by && <span className="text-muted"> · by {apt.booked_by}</span>}
                      <span className="text-muted"> · {STATUS_LABEL[apt.status] || apt.status}</span>
                    </div>
                    <span className="desk-small text-muted">{formatClock(apt.booked_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
