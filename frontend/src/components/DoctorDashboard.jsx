import React from 'react';
import { formatTime, useBooking } from '../context/BookingContext';
import ModifyAppointments from './ModifyAppointments';

// A doctor's own queue for the selected day (the API only returns their own
// appointments to a DOCTOR login).
const DoctorDashboard = () => {
  const { date, setDate, queue, appointmentsLoading } = useBooking();
  const show = (n) => (appointmentsLoading ? '—' : n);

  return (
    <div className="w-full h-full">
      <div className="desk-card-head mb-4">
        <h2 className="text-2xl m-0">Consultation Queue</h2>
        <label className="desk-date">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 2, minWidth: 0 }}>
          <ModifyAppointments title="My appointments" doctorMode />
        </div>

        <div className="card" style={{ flex: 1, position: 'sticky', top: '2rem' }}>
          <h3 className="text-lg font-semibold mb-2">My Overview</h3>
          <div className="flex flex-col gap-2">
            <div className="desk-summary-row"><span className="text-muted">Patients</span><span className="font-semibold text-lg">{show(queue.total)}</span></div>
            <div className="desk-summary-row"><span className="text-muted">Waiting</span><span className="font-semibold text-lg desk-tone-primary">{show(queue.waiting)}</span></div>
            <div className="desk-summary-row"><span className="text-muted">Completed</span><span className="font-semibold text-lg desk-tone-success">{show(queue.completed)}</span></div>
            <div className="desk-summary-row"><span className="text-muted">No-show</span><span className="font-semibold text-lg">{show(queue.noShow)}</span></div>
          </div>
          {queue.next && (
            <div className="desk-next mt-4">
              <div className="desk-small text-muted">Next patient</div>
              <div className="font-semibold">#{queue.next.token} {queue.next.patient.full_name}</div>
              <div className="desk-small text-muted">{formatTime(queue.next.time)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DoctorDashboard;
