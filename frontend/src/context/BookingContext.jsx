import React, { createContext, useState, useContext } from 'react';
import { mockDoctors, mockSlots, mockPatients, mockQueue, mockAppointments } from '../mockData';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointments, setAppointments] = useState(mockAppointments);
  const [patients, setPatients] = useState(mockPatients);
  const [queue, setQueue] = useState(mockQueue);
  const [nextToken, setNextToken] = useState(27);

  // Mock search fn
  const searchPatients = (query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    const result = patients.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.phone.includes(lowerQuery)
    );
    return result.slice(0, 5); // limit to 5 for speed
  };

  const addPatient = (patient) => {
    const newPatient = { ...patient, id: `p-${Date.now()}` };
    setPatients([...patients, newPatient]);
    return newPatient;
  };

  const confirmBooking = () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot) return false;
    
    const newAppointment = {
      id: `apt-${Date.now()}`,
      patient: selectedPatient,
      doctor: selectedDoctor,
      slot: selectedSlot,
      status: 'CONFIRMED',
      token: nextToken,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setAppointments([newAppointment, ...appointments]);
    setNextToken(nextToken + 1);
    setQueue({ ...queue, waiting: queue.waiting + 1 });
    
    // Reset selection for next fast booking
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    return newAppointment;
  };

  const updateAppointment = (id, updates) => {
    setAppointments(appointments.map(apt => apt.id === id ? { ...apt, ...updates } : apt));
  };

  const cancelAppointment = (id) => {
    setAppointments(appointments.filter(apt => apt.id !== id));
  };

  const getAppointments = () => appointments;

  return (
    <BookingContext.Provider value={{
      selectedPatient, setSelectedPatient,
      selectedDoctor, setSelectedDoctor,
      selectedSlot, setSelectedSlot,
      searchPatients,
      addPatient,
      confirmBooking,
      appointments,
      getAppointments,
      updateAppointment,
      cancelAppointment,
      queue,
      patients
    }}>
      {children}
    </BookingContext.Provider>
  );
};
