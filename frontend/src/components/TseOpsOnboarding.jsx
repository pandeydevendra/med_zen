import React, { useEffect, useState } from 'react';
import { API_URL } from '../constants';

const EMPTY_FORM = { hospital_name: '', address: '', admin_username: '', admin_password: '' };

// tse_ops's one job today: onboard a new hospital plus its first admin user.
// Hospitals live in the backend's in-memory list (hospitals.py) — nothing is
// persisted to disk, so the list resets whenever the backend restarts.
const TseOpsOnboarding = ({ onLogout }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHospitals = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/tse-ops/hospitals`);
      if (!res.ok) throw new Error('Failed to load hospitals.');
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch (err) {
      setError(err.message || 'Failed to load hospitals.');
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/tse-ops/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Could not onboard this hospital.');
      }
      const hospital = await res.json();
      setHospitals((prev) => [...prev, hospital]);
      setSuccess(`${hospital.hospital_name} onboarded with admin "${hospital.admin_username}".`);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || 'Could not onboard this hospital.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ alignItems: 'center', backgroundColor: 'var(--secondary)', overflowY: 'auto', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>tse_ops — Onboard Hospital</h2>
          <button type="button" className="btn-outline" onClick={onLogout}>Log out</button>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="text-lg font-semibold mb-4">New hospital</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted">Hospital name *</label>
              <input
                type="text"
                className="w-full"
                value={form.hospital_name}
                onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted">Address</label>
              <input
                type="text"
                className="w-full"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted">Hospital admin username *</label>
              <input
                type="text"
                className="w-full"
                value={form.admin_username}
                onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted">Hospital admin password *</label>
              <input
                type="password"
                className="w-full"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                required
              />
            </div>

            {error && <div className="agent-chat-error">{error}</div>}
            {success && <div className="text-sm" style={{ color: 'var(--primary)' }}>{success}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Onboarding…' : 'Onboard hospital'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Onboarded hospitals ({hospitals.length})</h3>
          {hospitals.length === 0 ? (
            <p className="text-sm text-muted">None yet — onboard the first one above.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {hospitals.map((h) => (
                <div key={h.id} className="flex flex-col" style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <span className="font-semibold">{h.hospital_name}</span>
                  {h.address && <span className="text-sm text-muted">{h.address}</span>}
                  <span className="text-sm text-muted">Admin: {h.admin_username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TseOpsOnboarding;
