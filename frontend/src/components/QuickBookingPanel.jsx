import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const QuickBookingPanel = () => {
  const { selectedPatient, selectedDoctor, selectedSlot, confirmBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      confirmBooking();
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 400); // Simulate brief network call
  };

  const isReady = selectedPatient && selectedDoctor && selectedSlot;

  if (success) {
    return (
      <div className="card w-full" style={{ background: 'var(--success)', color: 'white' }}>
        <h3 className="text-xl font-semibold m-0 text-center">✓ Appointment Confirmed!</h3>
        <p className="text-center mt-2">Ready for next patient.</p>
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
          <span className="text-muted">Doctor:</span>
          <span className="font-semibold">{selectedDoctor ? selectedDoctor.name : '—'}</span>
        </div>
        <div className="flex justify-between border-bottom pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted">Time:</span>
          <span className="font-semibold">{selectedSlot ? selectedSlot.time : '—'}</span>
        </div>
      </div>

      <button
        className="btn-primary w-full text-xl py-3"
        style={{ height: '60px' }}
        disabled={!isReady || loading}
        onClick={handleConfirm}
      >
        {loading ? 'Confirming...' : (isReady ? 'CONFIRM BOOKING (Enter)' : 'Select Details')}
      </button>
    </div>
  );
};
export default QuickBookingPanel;
