import React, { useEffect } from 'react';
import PatientSearch from './PatientSearch';
import DoctorAvailability from './DoctorAvailability';
import QuickBookingPanel from './QuickBookingPanel';
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
      </div>

      {/* Right Column for Confirmation */}
      <div className="flex flex-col gap-6" style={{ flex: 1, position: 'sticky', top: '2rem' }}>
        <QuickBookingPanel />

        {/* Simple Status Card */}
        <div className="card w-full mt-4 bg-white">
          <h3 className="text-lg font-semibold mb-2">Today's Overview</h3>
          <div className="flex justify-between mb-2">
            <span className="text-muted">Total Appointments</span>
            <span className="font-semibold text-lg text-primary">42</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Wait time (avg.)</span>
            <span className="font-semibold text-lg text-danger">15m</span>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Dashboard;
