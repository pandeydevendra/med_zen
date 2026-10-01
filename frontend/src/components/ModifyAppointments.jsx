import React, { useState } from 'react';
import { STATUS_LABEL, formatDate, formatTime, useBooking } from '../context/BookingContext';

const STATUS_TONE = { BOOKED: 'primary', COMPLETED: 'success', NO_SHOW: 'warning', CANCELLED: 'muted' };

// The selected date's appointments with status actions. The front desk can
// mark Completed / No-show / Cancel and undo; in doctorMode there's no Cancel
// (the API refuses it for doctors too).
const ModifyAppointments = ({ title, doctorMode = false }) => {
  const { date, appointments, appointmentsLoading, appointmentsError, updateStatus, refresh } = useBooking();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const act = async (apt, status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel ${apt.patient.full_name}'s appointment at ${formatTime(apt.time)}?`)) return;
    setBusy(apt.appointment_uid);
    setError('');
    try {
      await updateStatus(apt.appointment_uid, status);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card w-full">
      <div className="desk-card-head">
        <h3 className="text-lg font-semibold m-0">{title || 'Appointments'}</h3>
        <span className="desk-small text-muted">{formatDate(date)}</span>
      </div>
      {error && <div className="desk-error mb-4">{error}</div>}
      {appointmentsLoading && appointments.length === 0 ? (
        <p className="text-muted">Loading appointments…</p>
      ) : appointmentsError ? (
        <div className="desk-error">
          {appointmentsError} <button type="button" className="desk-link" onClick={refresh}>Try again</button>
        </div>
      ) : appointments.length === 0 ? (
        <p className="desk-empty text-muted">No appointments for this day yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((apt) => {
            const isBusy = busy === apt.appointment_uid;
            return (
              <div key={apt.appointment_uid} className={`desk-appt${apt.status === 'CANCELLED' ? ' is-cancelled' : ''}`}>
                <div className="desk-appt-time">
                  <strong>{formatTime(apt.time)}</strong>
                  <span>Token {apt.token}</span>
                </div>
                <div className="desk-appt-main">
                  <div className="font-semibold">{apt.patient.full_name}</div>
                  <div className="desk-small text-muted">
                    {[apt.patient.phone, !doctorMode && apt.doctor.name, !doctorMode && apt.doctor.department].filter(Boolean).join(' · ')}
                  </div>
                  {apt.booked_by && <div className="desk-small text-muted">Booked by {apt.booked_by}</div>}
                </div>
                <span className={`desk-badge desk-tone-${STATUS_TONE[apt.status]}`}>{STATUS_LABEL[apt.status] || apt.status}</span>
                <div className="desk-appt-actions">
                  {apt.status === 'BOOKED' ? (
                    <>
                      <button type="button" className="desk-action is-success" disabled={isBusy} onClick={() => act(apt, 'COMPLETED')}>Completed</button>
                      <button type="button" className="desk-action" disabled={isBusy} onClick={() => act(apt, 'NO_SHOW')}>No-show</button>
                      {!doctorMode && (
                        <button type="button" className="desk-action is-danger" disabled={isBusy} onClick={() => act(apt, 'CANCELLED')}>Cancel</button>
                      )}
                    </>
                  ) : (
                    !(doctorMode && apt.status === 'CANCELLED') && (
                      <button type="button" className="desk-action" disabled={isBusy} onClick={() => act(apt, 'BOOKED')}>
                        {apt.status === 'CANCELLED' ? 'Restore' : 'Undo'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModifyAppointments;
