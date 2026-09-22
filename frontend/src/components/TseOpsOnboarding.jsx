import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../constants';

const EMPTY_FORM = { hospital_name: '', address: '', admin_username: '', admin_password: '', facility_type: 'Hospital' };
const DEFAULT_TYPES = ['Hospital', 'Clinic', 'Individual Doctor'];
const TYPE_ICON = { Hospital: '🏥', Clinic: '🏪', 'Individual Doctor': '🩺' };
const TYPE_BORDER = { Hospital: 'var(--primary)', Clinic: 'var(--success)', 'Individual Doctor': '#8b5cf6' };

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

// tse_ops's one job today: onboard a facility (hospital, clinic, or an
// individual doctor's practice) plus its first admin user. Facilities live
// in the backend's in-memory list (hospitals.py) — nothing is persisted to
// disk, so the list resets whenever the backend restarts. It ships seeded
// with sample facilities so this page isn't empty right after a deploy.
const TseOpsOnboarding = ({ onLogout }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [facilityTypes, setFacilityTypes] = useState(DEFAULT_TYPES);
  const [hospitals, setHospitals] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('All');

  const loadHospitals = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/tse-ops/hospitals`);
      if (!res.ok) throw new Error('Failed to load hospitals.');
      const data = await res.json();
      setHospitals(data.hospitals || []);
      if (data.facility_types?.length) setFacilityTypes(data.facility_types);
    } catch (err) {
      setError(err.message || 'Failed to load hospitals.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const counts = useMemo(() => {
    const c = Object.fromEntries(facilityTypes.map((t) => [t, 0]));
    hospitals.forEach((h) => {
      c[h.facility_type] = (c[h.facility_type] || 0) + 1;
    });
    return c;
  }, [hospitals, facilityTypes]);

  const visibleHospitals = filter === 'All' ? hospitals : hospitals.filter((h) => h.facility_type === filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/v1/tse-ops/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Could not onboard this facility.');
      }
      const hospital = await res.json();
      setHospitals((prev) => [...prev, hospital]);
      setSuccess(`"${hospital.hospital_name}" onboarded with admin "${hospital.admin_username}".`);
      setForm({ ...EMPTY_FORM, facility_type: form.facility_type });
    } catch (err) {
      setError(err.message || 'Could not onboard this facility.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <main className="main-content" style={{ width: '100%' }}>
        <header className="topbar">
          <div className="flex items-center gap-2">
            <h2 className="text-xl m-0" style={{ color: 'var(--primary)' }}>🏥 MediZen Ops</h2>
            <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>Powered by TSE Pvt Ltd.</span>
          </div>
          <button className="btn-outline" onClick={onLogout}>Log out</button>
        </header>

        <div className="page-content">
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
            {facilityTypes.map((type) => (
              <div key={type} className="card" style={{ flex: '1 1 180px', borderTop: `4px solid ${TYPE_BORDER[type] || 'var(--primary)'}` }}>
                <h3 className="text-muted text-sm font-bold uppercase tracking-wider">{TYPE_ICON[type]} {type}s</h3>
                <p className="text-4xl font-bold mt-2">{listLoading ? '—' : (counts[type] || 0)}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-6" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: 1, minWidth: '320px' }}>
              <h3 className="text-lg font-semibold mb-4">Onboard a new facility</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-muted">Facility type *</label>
                  <select
                    className="w-full"
                    value={form.facility_type}
                    onChange={(e) => setForm({ ...form, facility_type: e.target.value })}
                  >
                    {facilityTypes.map((type) => (
                      <option key={type} value={type}>{TYPE_ICON[type]} {type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-muted">
                    {form.facility_type === 'Individual Doctor' ? 'Doctor name *' : 'Facility name *'}
                  </label>
                  <input
                    type="text"
                    className="w-full"
                    value={form.hospital_name}
                    onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
                    placeholder={form.facility_type === 'Individual Doctor' ? 'e.g. Dr. R. Kumar — Cardiologist' : 'e.g. Patna General Hospital'}
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
                    placeholder="Optional"
                  />
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
                <p className="text-sm font-semibold text-muted" style={{ margin: 0 }}>First admin user</p>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-muted">Admin username *</label>
                  <input
                    type="text"
                    className="w-full"
                    value={form.admin_username}
                    onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-muted">Admin password *</label>
                  <input
                    type="password"
                    className="w-full"
                    value={form.admin_password}
                    onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                    required
                  />
                </div>

                {error && <div className="agent-chat-error">{error}</div>}
                {success && (
                  <div className="text-sm" style={{ color: 'var(--success)', fontWeight: 600 }}>
                    ✓ {success}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
                  {submitting ? 'Onboarding…' : 'Onboard facility'}
                </button>
              </form>
            </div>

            <div className="card" style={{ flex: 1.2, minWidth: '320px' }}>
              <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 className="text-lg font-semibold" style={{ margin: 0 }}>Facilities ({visibleHospitals.length})</h3>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {['All', ...facilityTypes].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={filter === type ? 'btn-primary' : 'btn-outline'}
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => setFilter(type)}
                    >
                      {type === 'All' ? 'All' : `${TYPE_ICON[type]} ${type}`}
                    </button>
                  ))}
                </div>
              </div>

              {listLoading ? (
                <p className="text-muted">Loading…</p>
              ) : visibleHospitals.length === 0 ? (
                <div className="ops-empty-state">
                  <span className="ops-empty-icon">🏥</span>
                  <p className="font-semibold" style={{ color: 'var(--text-main)' }}>Nothing here yet</p>
                  <p className="text-sm text-muted">Use the form to onboard the first one.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleHospitals.map((h) => (
                    <div key={h.id} className="ops-hospital-card">
                      <div className="ops-avatar">{initials(h.hospital_name)}</div>
                      <div className="flex flex-col" style={{ minWidth: 0 }}>
                        <span className="font-semibold">{h.hospital_name}</span>
                        {h.address && <span className="text-sm text-muted">{h.address}</span>}
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          <span className="ops-badge">{TYPE_ICON[h.facility_type]} {h.facility_type}</span>
                          <span className="ops-badge">👤 {h.admin_username}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TseOpsOnboarding;
