import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const QuickBookingPanel = () => {
  const { selectedPatient, selectedDoctor, selectedSlot, confirmBooking, queue } = useBooking();
  const [loading, setLoading] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      const appointment = confirmBooking();
      setLoading(false);
      setConfirmedAppointment(appointment);
    }, 400); // Simulate brief network call
  };

  const handleBookNext = () => {
    setConfirmedAppointment(null);
  };

  const isReady = selectedPatient && selectedDoctor && selectedSlot;

  if (confirmedAppointment) {
    return (
      <div className="card w-full" style={{ background: 'var(--success)', color: 'white' }}>
        <h3 className="text-xl font-semibold m-0 text-center mb-4">✅ Appointment Booked Successfully</h3>
        <div className="text-center mb-4">
          <div className="text-lg">Token No: <strong>{confirmedAppointment.token}</strong></div>
          <div>Time: <strong>{confirmedAppointment.slot.time}</strong></div>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex-1" style={{ background: 'white', color: 'var(--success)' }}>Print Slip</button>
          <button className="btn-primary flex-1" onClick={handleBookNext}>Book Next Patient</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full" style={{ background: isReady ? 'var(--surface)' : 'var(--background)' }}>
      <h3 className="text-lg font-semibold mb-4">3. Summary & Confirm</h3>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Patient:</span>
          <span className="font-semibold">{selectedPatient ? selectedPatient.name : '—'}</span>
        </div>
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Phone:</span>
          <span className="font-semibold">{selectedPatient ? selectedPatient.phone : '—'}</span>
        </div>
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Doctor:</span>
          <span className="font-semibold">{selectedDoctor ? selectedDoctor.name : '—'}</span>
        </div>
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Department:</span>
          <span className="font-semibold">{selectedDoctor ? selectedDoctor.department : '—'}</span>
        </div>
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Appointment Time:</span>
          <span className="font-semibold">{selectedSlot ? selectedSlot.time : '—'}</span>
        </div>
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Est. Wait Time:</span>
          <span className="font-semibold">{selectedDoctor ? `${selectedDoctor.delay} min` : '—'}</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-muted">Token No (Preview):</span>
          <span className="font-semibold">{isReady ? '27' : '—'}</span>
        </div>
      </div>

      <button
        className="btn-primary w-full text-xl py-3"
        style={{ height: '60px' }}
        disabled={!isReady || loading}
        onClick={handleConfirm}
      >
        {loading ? 'Confirming...' : (isReady ? 'Confirm Appointment' : 'Select Details')}
      </button>
    </div>
  );
};
export default QuickBookingPanel;
