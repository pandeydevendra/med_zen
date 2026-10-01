import React, { useEffect } from 'react';
import PatientSearch from './PatientSearch';
import DoctorAvailability from './DoctorAvailability';
import QuickBookingPanel from './QuickBookingPanel';
import TokenQueueCard from './TokenQueueCard';
import ModifyAppointments from './ModifyAppointments';
import { useBooking } from '../context/BookingContext';

const Dashboard = () => {
  const { confirmBooking, selectedPatient, selectedDoctor, selectedSlot } = useBooking();

  // Enter confirms once patient, doctor and slot are all chosen. Ignored while
  // typing in a field or when a dialog (e.g. Add patient) is open.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter' || !selectedPatient || !selectedDoctor || !selectedSlot) return;
      if (document.querySelector('.modal-overlay')) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (tag === 'INPUT') document.activeElement.blur();
      e.preventDefault();
      confirmBooking();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatient, selectedDoctor, selectedSlot, confirmBooking]);

  return (
    <div className="w-full flex gap-6 desk-layout" style={{ alignItems: 'flex-start' }}>

      {/* Left Column for Selection */}
      <div className="flex flex-col gap-6" style={{ flex: 2, minWidth: 0 }}>
        <PatientSearch />
        <DoctorAvailability />
        <ModifyAppointments title="Appointments" />
      </div>

      {/* Right Column for Confirmation */}
      <div className="flex flex-col gap-6" style={{ flex: 1, position: 'sticky', top: '2rem', minWidth: 0 }}>
        <QuickBookingPanel />
        <TokenQueueCard />
      </div>

    </div>
  );
};
export default Dashboard;
