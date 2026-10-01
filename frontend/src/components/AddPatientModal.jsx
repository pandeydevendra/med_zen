import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const EMPTY = { full_name: '', age: '', gender: '', phone: '' };

// What the receptionist had typed in the search box pre-fills the name, or the
// mobile number when it was digits.
const initialForm = (query) => ({ ...EMPTY, [/^[\d\s+-]+$/.test(query) ? 'phone' : 'full_name']: query });

// Registers a patient with the facility (POST /v1/booking/patients). The form
// is mounted fresh each time it opens, so the pre-fill is there on first paint.
const AddPatientModal = ({ isOpen, ...props }) => (isOpen ? <AddPatientForm {...props} /> : null);

const AddPatientForm = ({ onClose, initialQuery = '', onCreated }) => {
  const { addPatient } = useBooking();
  const [form, setForm] = useState(() => initialForm(initialQuery));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const setField = (key) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const patient = await addPatient({
        full_name: form.full_name,
        phone: form.phone,
        age: form.age === '' ? null : Number(form.age),
        gender: form.gender || null,
      });
      onCreated?.(patient);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="add-patient-title">
        <h3 id="add-patient-title" className="text-lg font-semibold mb-4">Add New Patient</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="desk-field">
            <span>Full name *</span>
            <input type="text" className="w-full" value={form.full_name} autoFocus
              onChange={setField('full_name')} required />
          </label>
          <label className="desk-field">
            <span>Mobile number *</span>
            <input type="tel" className="w-full" value={form.phone} placeholder="10-digit mobile"
              onChange={setField('phone')} required />
          </label>
          <div className="flex gap-4">
            <label className="desk-field" style={{ flex: 1 }}>
              <span>Age *</span>
              <input type="number" className="w-full" min="0" max="120" value={form.age}
                onChange={setField('age')} required />
            </label>
            <label className="desk-field" style={{ flex: 1 }}>
              <span>Gender *</span>
              <select className="w-full desk-select" value={form.gender}
                onChange={setField('gender')} required>
                <option value="">Select</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
          {error && <div className="desk-error">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Save & continue booking'}
            </button>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
