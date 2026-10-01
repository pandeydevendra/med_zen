import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL } from '../constants';

// Front-desk booking state, backed by the /v1/booking/* API (backend/booking.py).
// Everything is for the logged-in user's own facility and one selected date.
// The JWT comes from Login (localStorage `medzen_token`); a 401 calls
// onUnauthorized so the app can send the user back to the login screen.

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

const pad = (n) => String(n).padStart(2, '0');
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export const addDaysISO = (iso, days) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// '14:30' -> '2:30 PM'
export const formatTime = (hhmm) => {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

// '2026-10-05' -> 'Mon, 5 Oct 2026'
export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const formatFee = (fee) => (fee == null ? '—' : `₹${Number(fee).toLocaleString('en-IN')}`);

export const STATUS_LABEL = { BOOKED: 'Waiting', COMPLETED: 'Completed', NO_SHOW: 'No-show', CANCELLED: 'Cancelled' };

export const BookingProvider = ({ children, onUnauthorized }) => {
  const [date, setDate] = useState(todayISO());
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');
  const [bookableDate, setBookableDate] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [lastBooking, setLastBooking] = useState(null);

  // Responses for a date the user has already moved away from are dropped.
  const dateRef = useRef(date);
  dateRef.current = date;

  const api = useCallback(async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('medzen_token') || ''}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      onUnauthorized?.();
      throw new Error('Your session has expired. Please log in again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong. Please try again.');
    }
    return data;
  }, [onUnauthorized]);

  const loadDoctors = useCallback(async () => {
    const forDate = dateRef.current;
    setDoctorsLoading(true);
    setDoctorsError('');
    try {
      const data = await api(`/v1/booking/doctors?date=${forDate}`);
      if (forDate !== dateRef.current) return;
      setDoctors(data.doctors);
      setBookableDate(data.bookable_date);
    } catch (err) {
      if (forDate === dateRef.current) setDoctorsError(err.message);
    } finally {
      if (forDate === dateRef.current) setDoctorsLoading(false);
    }
  }, [api]);

  const loadAppointments = useCallback(async () => {
    const forDate = dateRef.current;
    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const data = await api(`/v1/booking/appointments?date=${forDate}`);
      if (forDate === dateRef.current) setAppointments(data.appointments);
    } catch (err) {
      if (forDate === dateRef.current) setAppointmentsError(err.message);
    } finally {
      if (forDate === dateRef.current) setAppointmentsLoading(false);
    }
  }, [api]);

  const refresh = useCallback(() => Promise.all([loadDoctors(), loadAppointments()]), [loadDoctors, loadAppointments]);

  useEffect(() => {
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setBookingError('');
    refresh();
  }, [date, refresh]);

  const searchPatients = useCallback(async (query) => {
    const data = await api(`/v1/booking/patients?q=${encodeURIComponent(query)}`);
    return data.patients;
  }, [api]);

  const addPatient = useCallback(
    (patient) => api('/v1/booking/patients', { method: 'POST', body: patient }),
    [api],
  );

  const selectSlot = useCallback((doctor, slot) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(slot);
    setBookingError('');
  }, []);

  const confirmBooking = useCallback(async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot || booking) return null;
    setBooking(true);
    setBookingError('');
    try {
      const appointment = await api('/v1/booking/appointments', {
        method: 'POST',
        body: { doctor_uid: selectedDoctor.doctor_uid, date, time: selectedSlot.time, patient_uid: selectedPatient.patient_uid },
      });
      setLastBooking(appointment);
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      refresh();
      return appointment;
    } catch (err) {
      setBookingError(err.message);
      loadDoctors(); // the slot may have just been taken
      return null;
    } finally {
      setBooking(false);
    }
  }, [api, booking, date, loadDoctors, refresh, selectedDoctor, selectedPatient, selectedSlot]);

  const updateStatus = useCallback(async (appointmentUid, status) => {
    await api(`/v1/booking/appointments/${encodeURIComponent(appointmentUid)}/status`, { method: 'POST', body: { status } });
    await refresh();
  }, [api, refresh]);

  const queue = useMemo(() => {
    const active = appointments.filter((a) => a.status !== 'CANCELLED');
    const waiting = appointments.filter((a) => a.status === 'BOOKED');
    return {
      total: active.length,
      waiting: waiting.length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      noShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
      cancelled: appointments.length - active.length,
      next: waiting[0] || null, // the list is ordered by time
    };
  }, [appointments]);

  return (
    <BookingContext.Provider value={{
      date, setDate,
      doctors, doctorsLoading, doctorsError, bookableDate,
      appointments, appointmentsLoading, appointmentsError,
      refresh,
      selectedPatient, setSelectedPatient,
      selectedDoctor, selectedSlot, selectSlot,
      searchPatients, addPatient,
      confirmBooking, booking, bookingError, lastBooking, setLastBooking,
      updateStatus,
      queue,
    }}>
      {children}
    </BookingContext.Provider>
  );
};
