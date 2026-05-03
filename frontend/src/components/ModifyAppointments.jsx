import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const ModifyAppointments = () => {
  const { appointments, updateAppointment, cancelAppointment } = useBooking();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEdit = (apt) => {
    setEditingId(apt.id);
    setEditForm({ slotId: apt.slot.id, doctorId: apt.doctor.id });
  };

  const handleSave = () => {
    // Mock update - in real app, would update slot and doctor
    updateAppointment(editingId, { /* updates */ });
    setEditingId(null);
  };

  const handleCancelApt = (id) => {
    if (window.confirm('Cancel this appointment?')) {
      cancelAppointment(id);
    }
  };

  return (
    <div className="card w-full">
      <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
      {appointments.length === 0 ? (
        <p className="text-muted">No appointments yet.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map(apt => (
            <div key={apt.id} className="border rounded p-3" style={{ borderColor: 'var(--border)' }}>
              {editingId === apt.id ? (
                <div>
                  <div className="mb-2">
                    <label className="block text-sm">Change Time</label>
                    <select
                      className="w-full"
                      value={editForm.slotId}
                      onChange={(e) => setEditForm({ ...editForm, slotId: e.target.value })}
                    >
                      {/* Mock slots */}
                      <option value="s1">09:00 AM</option>
                      <option value="s2">09:30 AM</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm">Change Doctor</label>
                    <select
                      className="w-full"
                      value={editForm.doctorId}
                      onChange={(e) => setEditForm({ ...editForm, doctorId: e.target.value })}
                    >
                      {/* Mock doctors */}
                      <option value="d1">Dr. Ramesh Sharma</option>
                      <option value="d2">Dr. Sunita Patel</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={handleSave}>Save</button>
                    <button className="btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{apt.patient.name}</div>
                    <div className="text-sm text-muted">{apt.doctor.name} - {apt.slot.time}</div>
                    <div className="text-sm text-muted">Status: {apt.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-outline text-sm" onClick={() => handleEdit(apt)}>Edit</button>
                    <button className="btn-danger text-sm" onClick={() => handleCancelApt(apt.id)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModifyAppointments;