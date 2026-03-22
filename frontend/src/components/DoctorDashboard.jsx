import React from 'react';
import { useBooking } from '../context/BookingContext';

const DoctorDashboard = () => {
  const { appointments } = useBooking();

  return (
    <div className="w-full h-full">
      <h2 className="text-2xl font-bold mb-6">Doctor's Consultation Queue</h2>
      
      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 2 }}>
          <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
          {appointments.length === 0 ? (
            <p className="text-muted text-center py-8" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              No appointments booked yet. The queue is empty.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 border rounded shadow-sm flex justify-between items-center" style={{ borderColor: 'var(--border)', borderStyle: 'solid', borderWidth: '1px', backgroundColor: 'white' }}>
                  <div>
                    <div className="font-semibold text-lg">{apt.patient.name}</div>
                    <div className="text-muted text-sm">{apt.patient.phone}</div>
                    <div className="text-xs text-muted mt-1">Booked: {apt.timestamp || 'Just now'}</div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="py-2 px-4 rounded bg-secondary text-primary font-bold">
                      {apt.slot.time}
                    </div>
                    <button className="btn-outline font-semibold" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6" style={{ flex: 1, position: 'sticky', top: '2rem' }}>
           <div className="card w-full mb-4 bg-white">
            <h3 className="text-lg font-semibold mb-2">My Overview</h3>
            <div className="flex justify-between mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-muted">Total Patients</span>
              <span className="font-semibold text-lg text-primary">{appointments.length}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted">Pending</span>
              <span className="font-semibold text-lg text-danger">{appointments.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DoctorDashboard;
