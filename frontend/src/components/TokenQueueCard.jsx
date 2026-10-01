import React from 'react';
import { formatTime, useBooking } from '../context/BookingContext';

const Stat = ({ label, value, tone }) => (
  <div className="desk-summary-row">
    <span className="text-muted">{label}</span>
    <span className={`font-semibold text-lg${tone ? ` desk-tone-${tone}` : ''}`}>{value}</span>
  </div>
);

const TokenQueueCard = () => {
  const { queue, appointmentsLoading } = useBooking();
  const show = (n) => (appointmentsLoading ? '—' : n);

  return (
    <div className="card w-full">
      <h3 className="text-lg font-semibold mb-2">Queue Status</h3>
      <div className="flex flex-col gap-2">
        <Stat label="Booked" value={show(queue.total)} />
        <Stat label="Waiting" value={show(queue.waiting)} tone="primary" />
        <Stat label="Completed" value={show(queue.completed)} tone="success" />
        <Stat label="No-show / Cancelled" value={show(`${queue.noShow} / ${queue.cancelled}`)} />
      </div>
      {queue.next && (
        <div className="desk-next mt-4">
          <div className="desk-small text-muted">Next up</div>
          <div className="font-semibold">
            #{queue.next.token} {queue.next.patient.full_name} · {formatTime(queue.next.time)}
          </div>
          <div className="desk-small text-muted">{queue.next.doctor.name}</div>
        </div>
      )}
    </div>
  );
};

export default TokenQueueCard;
