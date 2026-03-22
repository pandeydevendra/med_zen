import React, { createContext, useState, useContext } from 'react';
import { mockDoctors, mockSlots, mockPatients } from '../mockData';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointments, setAppointments] = useState([]);

  // Mock search fn
  const searchPatients = (query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    const result = mockPatients.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.phone.includes(lowerQuery)
    );
    return result.slice(0, 5); // limit to 5 for speed
  };

  const confirmBooking = () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot) return false;
    
    const newAppointment = {
      id: `apt-${Date.now()}`,
      patient: selectedPatient,
      doctor: selectedDoctor,
      slot: selectedSlot,
      status: 'CONFIRMED',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setAppointments([newAppointment, ...appointments]);
    
    // Reset selection for next fast booking
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    return true;
  };

  const getAppointments = () => appointments;

  return (
    <BookingContext.Provider value={{
      selectedPatient, setSelectedPatient,
      selectedDoctor, setSelectedDoctor,
      selectedSlot, setSelectedSlot,
      searchPatients,
      confirmBooking,
      appointments,
      getAppointments
    }}>
      {children}
    </BookingContext.Provider>
  );
};
