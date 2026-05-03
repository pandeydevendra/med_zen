import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const AddPatientModal = ({ isOpen, onClose, initialName }) => {
  const { addPatient, setSelectedPatient } = useBooking();
  const [form, setForm] = useState({
    name: initialName || '',
    age: '',
    gender: '',
    phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender || !form.phone) return;
    const newPatient = addPatient(form);
    setSelectedPatient(newPatient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Add New Patient</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              className="w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Age *</label>
            <input
              type="number"
              className="w-full"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Gender *</label>
            <select
              className="w-full"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mobile Number *</label>
            <input
              type="tel"
              className="w-full"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Save & Continue Booking</button>
            <button type="button" className="btn-outline flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;