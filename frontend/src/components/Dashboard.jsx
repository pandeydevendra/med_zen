import React, { useEffect } from 'react';
import PatientSearch from './PatientSearch';
import DoctorAvailability from './DoctorAvailability';
import QuickBookingPanel from './QuickBookingPanel';
import TokenQueueCard from './TokenQueueCard';
import ModifyAppointments from './ModifyAppointments';
import { useBooking } from '../context/BookingContext';

const Dashboard = () => {
  const { confirmBooking, selectedPatient, selectedDoctor, selectedSlot } = useBooking();

  // Handle keyboard shortcut for lightning fast booking
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Enter key confirms if everything is selected
      if (e.key === 'Enter' && selectedPatient && selectedDoctor && selectedSlot) {
        // Find the active element to ensure we're not inside the search input when triggering
        if (document.activeElement.tagName === 'INPUT') {
          // Blur input and confirm
          document.activeElement.blur();
        }
        confirmBooking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatient, selectedDoctor, selectedSlot, confirmBooking]);

  return (
    <div className="w-full flex gap-6" style={{ alignItems: 'flex-start' }}>

      {/* Left Column for Selection */}
      <div className="flex flex-col gap-6" style={{ flex: 2 }}>
        <PatientSearch />
        <DoctorAvailability />
        <ModifyAppointments />
      </div>

      {/* Right Column for Confirmation */}
      <div className="flex flex-col gap-6" style={{ flex: 1, position: 'sticky', top: '2rem' }}>
        <QuickBookingPanel />
        <TokenQueueCard />
      </div>

    </div>
  );
};
export default Dashboard;
