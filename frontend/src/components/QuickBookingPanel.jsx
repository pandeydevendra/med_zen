import React from 'react';
import { formatDate, formatFee, formatTime, useBooking } from '../context/BookingContext';

const Row = ({ label, children }) => (
  <div className="desk-summary-row">
    <span className="text-muted">{label}</span>
    <span className="font-semibold" style={{ textAlign: 'right' }}>{children}</span>
  </div>
);

const QuickBookingPanel = () => {
  const {
    date, selectedPatient, selectedDoctor, selectedSlot,
    confirmBooking, booking, bookingError, lastBooking, setLastBooking,
  } = useBooking();

  const isReady = selectedPatient && selectedDoctor && selectedSlot;

  if (lastBooking) {
    return (
      <div className="card w-full desk-confirmed">
        <h3 className="text-xl font-semibold m-0 mb-4" style={{ textAlign: 'center' }}>✅ Appointment booked</h3>
        <div className="desk-token">
          <span>Token</span>
          <strong>{lastBooking.token}</strong>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <Row label="Patient">{lastBooking.patient.full_name}</Row>
          <Row label="Doctor">{lastBooking.doctor.name}</Row>
          <Row label="Date">{formatDate(lastBooking.date)}</Row>
          <Row label="Time">{formatTime(lastBooking.time)}</Row>
          <Row label="Fee">{formatFee(lastBooking.consultation_fee)}</Row>
          <Row label="Booked by">{lastBooking.booked_by}</Row>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>Print slip</button>
          <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setLastBooking(null)}>Book next patient</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full">
      <h3 className="text-lg font-semibold mb-4">3. Summary &amp; Confirm</h3>

      <div className="flex flex-col gap-2 mb-4">
        <Row label="Patient">{selectedPatient ? selectedPatient.full_name : '—'}</Row>
        <Row label="Mobile">{selectedPatient ? selectedPatient.phone : '—'}</Row>
        <Row label="Doctor">{selectedDoctor ? selectedDoctor.name : '—'}</Row>
        <Row label="Department">{selectedDoctor ? selectedDoctor.department || 'General' : '—'}</Row>
        <Row label="Date">{formatDate(date)}</Row>
        <Row label="Time">{selectedSlot ? formatTime(selectedSlot.time) : '—'}</Row>
        <Row label="Token">{selectedSlot ? selectedSlot.token : '—'}</Row>
        <Row label="Consultation fee">{selectedDoctor ? formatFee(selectedDoctor.consultation_fee) : '—'}</Row>
      </div>

      {bookingError && <div className="desk-error mb-4">{bookingError}</div>}

      <button
        type="button"
        className="btn-primary w-full desk-confirm-btn"
        disabled={!isReady || booking}
        onClick={confirmBooking}
      >
        {booking ? 'Booking…' : isReady ? 'Confirm appointment' : 'Select patient, doctor and slot'}
      </button>
      {isReady && !booking && <div className="desk-small text-muted mt-2" style={{ textAlign: 'center' }}>or press Enter</div>}
    </div>
  );
};
export default QuickBookingPanel;
