import React from 'react';
import { useBooking } from '../context/BookingContext';

const TokenQueueCard = () => {
  const { queue } = useBooking();

  return (
    <div className="card w-full">
      <h3 className="text-lg font-semibold mb-2">Queue Status</h3>
      <div className="flex justify-between mb-2">
        <span className="text-muted">Current Token</span>
        <span className="font-semibold text-lg text-primary">{queue.currentToken}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-muted">Next Token</span>
        <span className="font-semibold text-lg">{queue.currentToken + 1}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-muted">Patients Waiting</span>
        <span className="font-semibold text-lg">{queue.waiting}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Average Wait Time</span>
        <span className="font-semibold text-lg text-danger">{queue.avgWait} min</span>
      </div>
    </div>
  );
};

export default TokenQueueCard;