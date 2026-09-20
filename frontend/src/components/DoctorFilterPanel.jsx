import React, { useCallback, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DoctorFilterPanel = () => {
  const [filters, setFilters] = useState({ specialty: '', day: '' });
  const [options, setOptions] = useState({ specialties: [], days: [] });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFilterOptions = useCallback(() => {
    return fetch(`${API_URL}/v1/doctors/filters`)
      .then(res => res.json())
      .then(setOptions)
      .catch(() => {});
  }, []);

  const fetchDoctors = useCallback((f) => {
    const params = new URLSearchParams();
    if (f.specialty) params.set('specialty', f.specialty);
    if (f.day) params.set('day', f.day);

    setLoading(true);
    setError('');
    return fetch(`${API_URL}/v1/doctors?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
      })
      .then(data => setDoctors(data.doctors))
      .catch(() => setError('Could not load doctors. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDoctors(filters), 250);
    return () => clearTimeout(timer);
  }, [filters, fetchDoctors]);

  const handleChange = (field) => (e) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleReset = () => setFilters({ specialty: '', day: '' });

  const handleRefresh = () => {
    fetchFilterOptions();
    fetchDoctors(filters);
  };

  return (
    <div className="card doctor-filter-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold m-0">🔎 Find a Doctor</h3>
        <button
          type="button"
          className="btn-outline refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh doctor data"
        >
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>⟳</span> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-muted">Specialty</label>
          <select value={filters.specialty} onChange={handleChange('specialty')}>
            <option value="">All specialties</option>
            {options.specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-muted">Available on</label>
          <select value={filters.day} onChange={handleChange('day')}>
            <option value="">Any day</option>
            {options.days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {(filters.specialty || filters.day) && (
          <button type="button" className="btn-outline" onClick={handleReset}>
            Clear filters
          </button>
        )}
      </div>

      <div className="doctor-filter-results">
        {loading && <div className="text-muted text-sm mt-4">Loading…</div>}
        {!loading && error && <div className="agent-chat-error mt-4">{error}</div>}
        {!loading && !error && doctors.length === 0 && (
          <div className="text-muted text-sm mt-4">No doctors match these filters.</div>
        )}
        {!loading && !error && doctors.map(doc => (
          <div key={doc.name} className="doctor-result-card">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{doc.name}</span>
              <span className="doctor-fee">{doc.fee}</span>
            </div>
            <div className="text-muted text-sm">{doc.specialty} · {doc.location}</div>
            <div className="doctor-availability-tags">
              {Object.entries(doc.availability).map(([day, slots]) => (
                <span key={day} className="availability-tag" title={slots.join(', ')}>
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorFilterPanel;
