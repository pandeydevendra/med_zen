import React, { useMemo, useState } from 'react';
import { addDaysISO, formatDate, formatFee, formatTime, todayISO, useBooking } from '../context/BookingContext';

const BOOKING_WINDOW_DAYS = 60; // matches backend/booking.py

const DoctorAvailability = () => {
  const {
    date, setDate, doctors, doctorsLoading, doctorsError, bookableDate, refresh,
    selectedDoctor, selectedSlot, selectSlot, selectedPatient,
  } = useBooking();
  const [activeTab, setActiveTab] = useState('All');

  const departments = useMemo(
    () => ['All', ...new Set(doctors.map((d) => d.department || 'General'))],
    [doctors],
  );
  const department = departments.includes(activeTab) ? activeTab : 'All';
  const filteredDocs = department === 'All' ? doctors : doctors.filter((d) => (d.department || 'General') === department);
  const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });

  const handleDoctorClick = (doc) => {
    const next = doc.slots.find((s) => s.available);
    if (next) selectSlot(doc, next);
  };

  return (
    <div className="card w-full" style={{ transition: 'opacity 0.2s', opacity: selectedPatient ? 1 : 0.6, pointerEvents: selectedPatient ? 'auto' : 'none' }}>
      <div className="desk-card-head">
        <h3 className="text-lg font-semibold m-0">2. Select Doctor &amp; Slot</h3>
        <label className="desk-date">
          <span>Date</span>
          <input type="date" value={date} min={todayISO()} max={addDaysISO(todayISO(), BOOKING_WINDOW_DAYS)}
            onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      {departments.length > 2 && (
        <div className="flex gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setActiveTab(dept)}
              className={department === dept ? 'desk-chip is-active' : 'desk-chip'}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {!bookableDate && !doctorsLoading && (
        <div className="desk-note mb-4">Bookings are open from today up to {BOOKING_WINDOW_DAYS} days ahead. Showing existing bookings only.</div>
      )}

      {doctorsLoading ? (
        <p className="text-muted">Loading doctors…</p>
      ) : doctorsError ? (
        <div className="desk-error">
          {doctorsError} <button type="button" className="desk-link" onClick={refresh}>Try again</button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="desk-empty">
          <div className="font-semibold">No doctors are set up for booking yet.</div>
          <div className="text-muted desk-small">Ask your MediZen administrator to add your doctors, their consultation hours and fees.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4" style={{ maxHeight: '460px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {filteredDocs.map((doc) => {
            const isDocSelected = selectedDoctor?.doctor_uid === doc.doctor_uid;
            const open = doc.slots.filter((s) => s.available).length;
            const booked = doc.slots.filter((s) => s.status === 'booked').length;
            const availability = open
              ? `${open} of ${doc.slots.length} slots open`
              : booked === doc.slots.length ? 'Fully booked' : 'No slots left';
            return (
              <div
                key={doc.doctor_uid}
                className={`desk-doctor${isDocSelected ? ' is-selected' : ''}${open ? '' : ' is-unavailable'}`}
                onClick={() => handleDoctorClick(doc)}
              >
                <div className="flex justify-between" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                  <div>
                    <div className="font-semibold text-lg">{doc.name}</div>
                    <div className="text-muted desk-small">{doc.department || 'General'}</div>
                    {doc.weekly_hours.length > 0 && (
                      <div className="text-muted desk-small">OPD: {doc.weekly_hours.join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-semibold">{formatFee(doc.consultation_fee)}</div>
                    <div className="desk-small text-muted">consultation</div>
                  </div>
                </div>

                {doc.slots.length === 0 ? (
                  <div className="desk-small text-muted mt-2">Not available on {weekday}.</div>
                ) : (
                  <>
                    <div className="desk-small text-muted mt-2">
                      {doc.windows.map((w) => `${formatTime(w.start)} – ${formatTime(w.end)}`).join(', ')}
                      {' · '}{availability}
                    </div>
                    <div className="slot-grid">
                      {doc.slots.map((slot) => {
                        const isSelected = isDocSelected && selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            className={`slot-btn${isSelected ? ' selected' : ''}`}
                            disabled={!slot.available}
                            title={slot.status === 'booked' ? 'Already booked' : slot.status === 'past' ? 'Time has passed' : `Token ${slot.token}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectSlot(doc, slot);
                            }}
                          >
                            {formatTime(slot.time)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!doctorsLoading && !doctorsError && doctors.length > 0 && (
        <div className="desk-small text-muted mt-2">{formatDate(date)}</div>
      )}
    </div>
  );
};
export default DoctorAvailability;
