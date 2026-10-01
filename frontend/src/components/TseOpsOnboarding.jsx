import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_URL } from '../constants';

const EMPTY_FORM = {
  hospital_name: '',
  address: '',
  email: '',
  contact_number: '',
  admin_username: '',
  admin_email: '',
  admin_password: '',
  facility_type: 'Hospital',
};
const DEFAULT_TYPES = ['Hospital', 'Clinic', 'Individual Doctor'];

// Per-type display metadata. `tone` picks the ops-tone-* colour class.
const TYPE_META = {
  Hospital: { tone: 'blue', plural: 'Hospitals', hint: 'Multi-department facility' },
  Clinic: { tone: 'green', plural: 'Clinics', hint: 'Outpatient or family practice' },
  'Individual Doctor': { tone: 'purple', plural: 'Individual doctors', hint: "A single doctor's practice" },
};
const metaFor = (type) => TYPE_META[type] || { tone: 'blue', plural: `${type}s`, hint: '' };

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .filter((word) => /^[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

// Small inline icons (no icon library in this project). All inherit currentColor.
const Icon = ({ name, size = 18 }) => {
  const paths = {
    hospital: <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M12 9v6M9 12h6" /></>,
    clinic: <><path d="M3 21h18" /><path d="M4 21V10l8-6 8 6v11" /><path d="M10 21v-5h4v5" /></>,
    doctor: <><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    check: <path d="M20 6 9 17l-5-5" />,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></>,
    pin: <><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20v-1a6.5 6.5 0 0 0-4-6" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};
const TYPE_ICON = { Hospital: 'hospital', Clinic: 'clinic', 'Individual Doctor': 'doctor' };
const typeIcon = (type) => TYPE_ICON[type] || 'hospital';

const ROLE_META = {
  ADMIN: { label: 'Admin', tone: 'blue' },
  DOCTOR: { label: 'Doctor', tone: 'purple' },
  RECEPTIONIST: { label: 'Receptionist', tone: 'green' },
};
const roleMeta = (role) => ROLE_META[role] || { label: role, tone: 'slate' };

// Non-login staff roles (the `staff` table's staff_role).
const STAFF_ROLE_META = {
  DOCTOR: { label: 'Doctor', plural: 'Doctors', tone: 'purple' },
  NURSE: { label: 'Nurse', plural: 'Nurses', tone: 'green' },
  ADMIN_STAFF: { label: 'Admin staff', plural: 'Admin staff', tone: 'blue' },
  RECEPTIONIST: { label: 'Receptionist', plural: 'Receptionists', tone: 'purple' },
  TECHNICIAN: { label: 'Technician', plural: 'Technicians', tone: 'slate' },
  PHARMACIST: { label: 'Pharmacist', plural: 'Pharmacists', tone: 'slate' },
  ASSISTANT: { label: 'Assistant', plural: 'Assistants', tone: 'slate' },
};
const staffRoleMeta = (role) => STAFF_ROLE_META[role] || { label: 'Other', plural: 'Other', tone: 'slate' };
const GENDER_LABEL = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const countBy = (items, key) =>
  items.reduce((c, item) => ({ ...c, [item[key]]: (c[item[key]] || 0) + 1 }), {});

// tse_ops: onboard a facility (hospital, clinic, or an individual doctor's
// practice) plus its first admin user, and view each facility's staff and
// login accounts. Facilities are stored in MySQL via the backend
// (ops_onboarding.py). The list is the main view; the onboarding form and the
// facility details open in slide-over panels.
const TseOpsOnboarding = ({ userName, onLogout }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [facilityTypes, setFacilityTypes] = useState(DEFAULT_TYPES);
  const [hospitals, setHospitals] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [detailFacility, setDetailFacility] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const firstFieldRef = useRef(null);
  const detailRequestRef = useRef(0);

  const loadHospitals = async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await fetch(`${API_URL}/v1/tse-ops/hospitals`);
      if (!res.ok) throw new Error('Could not load facilities.');
      const data = await res.json();
      setHospitals(data.hospitals || []);
      if (data.facility_types?.length) setFacilityTypes(data.facility_types);
    } catch (err) {
      setListError(err.message || 'Could not load facilities.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  // Esc closes the panel; focus the first field when it opens.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && !submitting && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 200);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [drawerOpen, submitting]);

  useEffect(() => {
    if (!detailFacility) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDetailFacility(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailFacility]);

  // Loads GET /v1/ops/hospitals/{uid}/staff and /users together; both need the
  // ops JWT that Login stored. The request counter drops responses that arrive
  // after another facility was opened.
  const openFacility = async (facility) => {
    const requestId = ++detailRequestRef.current;
    const isCurrent = () => requestId === detailRequestRef.current;
    setDetailFacility(facility);
    setDetailData(null);
    setDetailError('');
    setDetailLoading(true);
    const headers = { Authorization: `Bearer ${localStorage.getItem('medzen_token') || ''}` };
    const base = `${API_URL}/v1/ops/hospitals/${encodeURIComponent(facility.id)}`;
    try {
      const responses = await Promise.all([fetch(`${base}/staff`, { headers }), fetch(`${base}/users`, { headers })]);
      if (responses.some((res) => res.status === 401)) {
        onLogout();
        return;
      }
      const failed = responses.find((res) => !res.ok);
      if (failed) {
        throw new Error(failed.status === 403
          ? "Your account doesn't have access to this facility."
          : failed.status === 404 ? 'This facility no longer exists.' : "Could not load this facility's details.");
      }
      const [staffData, usersData] = await Promise.all(responses.map((res) => res.json()));
      if (isCurrent()) setDetailData({ ...usersData, staff: staffData.staff });
    } catch (err) {
      if (isCurrent()) setDetailError(err.message || "Could not load this facility's details.");
    } finally {
      if (isCurrent()) setDetailLoading(false);
    }
  };

  const staffCounts = useMemo(() => countBy(detailData?.staff || [], 'role'), [detailData]);
  const userCounts = useMemo(() => countBy(detailData?.users || [], 'role'), [detailData]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(facilityTypes.map((t) => [t, 0]));
    hospitals.forEach((h) => {
      c[h.facility_type] = (c[h.facility_type] || 0) + 1;
    });
    return c;
  }, [hospitals, facilityTypes]);

  const visibleHospitals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hospitals.filter((h) => {
      if (filter !== 'All' && h.facility_type !== filter) return false;
      if (!q) return true;
      return [h.hospital_name, h.address, h.email, h.contact_number, h.admin_username, h.admin_email]
        .some((v) => v && v.toLowerCase().includes(q));
    });
  }, [hospitals, filter, query]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const openDrawer = () => {
    setFormError('');
    setShowPassword(false);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (!submitting) setDrawerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/v1/tse-ops/hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === 'string' ? body.detail : 'Could not onboard this facility.');
      }
      const hospital = await res.json();
      setHospitals((prev) => [hospital, ...prev]);
      setHighlightId(hospital.id);
      setFilter('All');
      setQuery('');
      setToast(`${hospital.hospital_name} onboarded. Admin can sign in with ${hospital.admin_username}.`);
      setForm({ ...EMPTY_FORM, facility_type: form.facility_type });
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err.message || 'Could not onboard this facility.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDoctor = form.facility_type === 'Individual Doctor';

  return (
    <div className="ops-shell">
      <header className="ops-topbar">
        <div className="ops-brand">
          <span className="ops-brand-mark"><Icon name="hospital" size={20} /></span>
          <div className="ops-brand-text">
            <span className="ops-brand-name">MediZen Ops</span>
            <span className="ops-brand-sub">Powered by TSE Pvt Ltd.</span>
          </div>
          <span className="ops-env-pill">Internal</span>
        </div>
        <div className="ops-topbar-actions">
          {userName && <span className="ops-topbar-user">{userName}</span>}
          <button type="button" className="ops-btn ops-btn-ghost" onClick={onLogout}>
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      </header>

      <main className="ops-main">
        <div className="ops-page-header">
          <div>
            <h1 className="ops-page-title">Facility onboarding</h1>
            <p className="ops-page-sub">Register hospitals, clinics and individual doctors on MediZen, and create their first admin account.</p>
          </div>
          <button type="button" className="ops-btn ops-btn-primary" onClick={openDrawer}>
            <Icon name="plus" size={16} /> Onboard facility
          </button>
        </div>

        <section className="ops-stats" aria-label="Facility totals">
          <div className="ops-stat">
            <span className="ops-stat-icon ops-tone-slate"><Icon name="grid" /></span>
            <div>
              <div className="ops-stat-label">Total facilities</div>
              <div className="ops-stat-value">{listLoading ? '—' : hospitals.length}</div>
            </div>
          </div>
          {facilityTypes.map((type) => (
            <div key={type} className="ops-stat">
              <span className={`ops-stat-icon ops-tone-${metaFor(type).tone}`}><Icon name={typeIcon(type)} /></span>
              <div>
                <div className="ops-stat-label">{metaFor(type).plural}</div>
                <div className="ops-stat-value">{listLoading ? '—' : counts[type] || 0}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="ops-panel">
          <div className="ops-toolbar">
            <div className="ops-tabs" role="tablist" aria-label="Filter by facility type">
              {['All', ...facilityTypes].map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={filter === type}
                  className={`ops-tab${filter === type ? ' is-active' : ''}`}
                  onClick={() => setFilter(type)}
                >
                  {type === 'All' ? 'All' : metaFor(type).plural}
                  <span className="ops-tab-count">{type === 'All' ? hospitals.length : counts[type] || 0}</span>
                </button>
              ))}
            </div>
            <label className="ops-search">
              <Icon name="search" size={16} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, address, phone or email"
                aria-label="Search facilities"
              />
            </label>
          </div>

          {listError ? (
            <div className="ops-state">
              <span className="ops-state-icon ops-tone-red"><Icon name="alert" size={22} /></span>
              <p className="ops-state-title">{listError}</p>
              <button type="button" className="ops-btn ops-btn-secondary" onClick={loadHospitals}>Try again</button>
            </div>
          ) : listLoading ? (
            <div className="ops-table" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="ops-row ops-row-skeleton">
                  <span className="ops-skel ops-skel-avatar" />
                  <span className="ops-skel" style={{ width: '40%' }} />
                  <span className="ops-skel" style={{ width: '20%' }} />
                </div>
              ))}
            </div>
          ) : visibleHospitals.length === 0 ? (
            <div className="ops-state">
              <span className="ops-state-icon ops-tone-slate"><Icon name={hospitals.length ? 'search' : 'hospital'} size={22} /></span>
              <p className="ops-state-title">{hospitals.length ? 'No facilities match your filters' : 'No facilities onboarded yet'}</p>
              <p className="ops-state-sub">
                {hospitals.length ? 'Try a different search term or facility type.' : 'Onboard the first hospital, clinic or doctor to get started.'}
              </p>
              {hospitals.length ? (
                <button type="button" className="ops-btn ops-btn-secondary" onClick={() => { setQuery(''); setFilter('All'); }}>
                  Clear filters
                </button>
              ) : (
                <button type="button" className="ops-btn ops-btn-primary" onClick={openDrawer}>
                  <Icon name="plus" size={16} /> Onboard facility
                </button>
              )}
            </div>
          ) : (
            <div className="ops-table" role="table">
              <div className="ops-row ops-row-head" role="row">
                <span role="columnheader">Facility</span>
                <span role="columnheader">Type</span>
                <span role="columnheader">Admin login</span>
                <span role="columnheader">Facility contact</span>
                <span role="columnheader"><span className="ops-sr-only">Actions</span></span>
              </div>
              {visibleHospitals.map((h) => (
                <div
                  key={h.id}
                  role="row"
                  className={`ops-row ops-row-clickable${h.id === highlightId ? ' is-new' : ''}`}
                  onClick={() => openFacility(h)}
                >
                  <div className="ops-cell-facility" role="cell">
                    <span className={`ops-avatar ops-tone-${metaFor(h.facility_type).tone}`}>{initials(h.hospital_name)}</span>
                    <div className="ops-cell-stack">
                      <span className="ops-cell-primary">{h.hospital_name}</span>
                      {h.address && <span className="ops-cell-secondary"><Icon name="pin" size={13} /> {h.address}</span>}
                    </div>
                  </div>
                  <div role="cell" data-label="Type">
                    <span className={`ops-type-badge ops-tone-${metaFor(h.facility_type).tone}`}>
                      <Icon name={typeIcon(h.facility_type)} size={13} /> {h.facility_type}
                    </span>
                  </div>
                  <div className="ops-cell-stack" role="cell" data-label="Admin login">
                    <span className="ops-cell-primary ops-mono">{h.admin_username || '—'}</span>
                    {h.admin_email && <span className="ops-cell-secondary">{h.admin_email}</span>}
                  </div>
                  <div className="ops-cell-stack" role="cell" data-label="Contact">
                    {h.contact_number || h.email ? (
                      <>
                        {h.contact_number && <span className="ops-cell-secondary"><Icon name="phone" size={13} /> {h.contact_number}</span>}
                        {h.email && <span className="ops-cell-secondary"><Icon name="mail" size={13} /> {h.email}</span>}
                      </>
                    ) : (
                      <span className="ops-cell-secondary">—</span>
                    )}
                  </div>
                  <div className="ops-cell-actions" role="cell">
                    <button
                      type="button"
                      className="ops-btn ops-btn-secondary ops-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFacility(h);
                      }}
                      aria-label={`View staff and users of ${h.hospital_name}`}
                    >
                      <Icon name="users" size={15} /> Staff &amp; users
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div
        className={`ops-scrim${drawerOpen || detailFacility ? ' is-open' : ''}`}
        onClick={() => {
          closeDrawer();
          setDetailFacility(null);
        }}
        aria-hidden="true"
      />

      <aside
        className={`ops-drawer${detailFacility ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-detail-title"
        aria-hidden={!detailFacility}
      >
        {detailFacility && (
          <div className="ops-drawer-form">
            <div className="ops-drawer-header">
              <div className="ops-cell-facility">
                <span className={`ops-avatar ops-tone-${metaFor(detailFacility.facility_type).tone}`}>
                  {initials(detailFacility.hospital_name)}
                </span>
                <div className="ops-cell-stack">
                  <h2 id="ops-detail-title" className="ops-drawer-title">{detailFacility.hospital_name}</h2>
                  <p className="ops-drawer-sub">
                    {detailFacility.facility_type}
                    {detailData && !detailData.is_active && ' · Inactive facility'}
                  </p>
                </div>
              </div>
              <button type="button" className="ops-icon-btn" onClick={() => setDetailFacility(null)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>

            <div className="ops-drawer-body">
              {detailLoading ? (
                <div className="ops-user-list" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="ops-user-card">
                      <span className="ops-skel ops-skel-avatar" />
                      <span className="ops-skel" style={{ width: '60%', marginTop: '0.75rem' }} />
                    </div>
                  ))}
                </div>
              ) : detailError ? (
                <div className="ops-state">
                  <span className="ops-state-icon ops-tone-red"><Icon name="alert" size={22} /></span>
                  <p className="ops-state-title">{detailError}</p>
                  <button type="button" className="ops-btn ops-btn-secondary" onClick={() => openFacility(detailFacility)}>
                    Try again
                  </button>
                </div>
              ) : detailData && (
                <>
                  <section className="ops-detail-section" aria-labelledby="ops-staff-heading">
                    <div className="ops-detail-heading">
                      <h3 id="ops-staff-heading">Staff <span className="ops-tab-count">{detailData.staff.length}</span></h3>
                      <div className="ops-role-summary">
                        {Object.entries(staffCounts).map(([role, n]) => (
                          <span key={role} className={`ops-type-badge ops-tone-${staffRoleMeta(role).tone}`}>
                            {n} {n === 1 ? staffRoleMeta(role).label : staffRoleMeta(role).plural}
                          </span>
                        ))}
                      </div>
                    </div>
                    {detailData.staff.length === 0 ? (
                      <p className="ops-detail-empty">No staff recorded for this facility.</p>
                    ) : (
                      <ul className="ops-user-list">
                        {detailData.staff.map((s) => (
                          <li key={s.staff_uid} className={`ops-user-card${s.is_active ? '' : ' is-inactive'}`}>
                            <span className={`ops-avatar ops-tone-${staffRoleMeta(s.role).tone}`}>{initials(s.full_name)}</span>
                            <div className="ops-cell-stack ops-user-main">
                              <div className="ops-user-head">
                                <span className="ops-cell-primary">{s.full_name}</span>
                                <span className={`ops-type-badge ops-tone-${staffRoleMeta(s.role).tone}`}>{staffRoleMeta(s.role).label}</span>
                                {!s.is_active && <span className="ops-type-badge ops-tone-slate">Inactive</span>}
                              </div>
                              <span className="ops-cell-secondary">
                                {[s.designation, GENDER_LABEL[s.gender]].filter(Boolean).join(' · ') || '—'}
                              </span>
                              {(s.department || s.consultation_fee != null) && (
                                <span className="ops-cell-secondary">
                                  {[s.department, s.consultation_fee != null && `Fee ₹${Number(s.consultation_fee).toLocaleString('en-IN')}`]
                                    .filter(Boolean).join(' · ')}
                                </span>
                              )}
                              {s.phone && (
                                <a className="ops-cell-secondary ops-contact-link" href={`tel:${s.phone}`}>
                                  <Icon name="phone" size={13} /> <span className="ops-mono">{s.phone}</span>
                                </a>
                              )}
                              {s.email && (
                                <a className="ops-cell-secondary ops-contact-link" href={`mailto:${s.email}`}>
                                  <Icon name="mail" size={13} /> {s.email}
                                </a>
                              )}
                            </div>
                            {s.joined_on && <span className="ops-user-date" title="Joined on">Since {formatDate(s.joined_on)}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="ops-detail-section" aria-labelledby="ops-logins-heading">
                    <div className="ops-detail-heading">
                      <h3 id="ops-logins-heading">App logins <span className="ops-tab-count">{detailData.users.length}</span></h3>
                      <div className="ops-role-summary">
                        {Object.entries(userCounts).map(([role, n]) => (
                          <span key={role} className={`ops-type-badge ops-tone-${roleMeta(role).tone}`}>
                            {n} {roleMeta(role).label}{n === 1 ? '' : 's'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="ops-help">People who can sign in to MediZen for this facility.</p>
                    {detailData.users.length === 0 ? (
                      <p className="ops-detail-empty">No login accounts yet.</p>
                    ) : (
                      <ul className="ops-user-list">
                        {detailData.users.map((u) => (
                          <li key={u.user_uid} className={`ops-user-card${u.is_active ? '' : ' is-inactive'}`}>
                            <span className={`ops-avatar ops-tone-${roleMeta(u.role).tone}`}>{initials(u.user_name)}</span>
                            <div className="ops-cell-stack ops-user-main">
                              <div className="ops-user-head">
                                <span className="ops-cell-primary">{u.user_name}</span>
                                <span className={`ops-type-badge ops-tone-${roleMeta(u.role).tone}`}>{roleMeta(u.role).label}</span>
                                {!u.is_active && <span className="ops-type-badge ops-tone-slate">Inactive</span>}
                              </div>
                              <span className="ops-cell-secondary"><Icon name="phone" size={13} /> <span className="ops-mono">{u.phone}</span></span>
                              {u.email && <span className="ops-cell-secondary"><Icon name="mail" size={13} /> {u.email}</span>}
                            </div>
                            <span className="ops-user-date" title="Added on">{formatDate(u.created_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </aside>
      <aside
        className={`ops-drawer${drawerOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-drawer-title"
        aria-hidden={!drawerOpen}
      >
        <form onSubmit={handleSubmit} className="ops-drawer-form">
          <div className="ops-drawer-header">
            <div>
              <h2 id="ops-drawer-title" className="ops-drawer-title">Onboard a facility</h2>
              <p className="ops-drawer-sub">Fields marked <span className="ops-req">*</span> are required.</p>
            </div>
            <button type="button" className="ops-icon-btn" onClick={closeDrawer} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>

          <div className="ops-drawer-body">
            <fieldset className="ops-fieldset">
              <legend className="ops-legend"><span className="ops-step">1</span> Facility type</legend>
              <div className="ops-type-picker">
                {facilityTypes.map((type) => (
                  <label key={type} className={`ops-type-option${form.facility_type === type ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="facility_type"
                      value={type}
                      checked={form.facility_type === type}
                      onChange={setField('facility_type')}
                    />
                    <span className={`ops-type-option-icon ops-tone-${metaFor(type).tone}`}><Icon name={typeIcon(type)} /></span>
                    <span className="ops-type-option-name">{type}</span>
                    <span className="ops-type-option-hint">{metaFor(type).hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="ops-fieldset">
              <legend className="ops-legend"><span className="ops-step">2</span> {isDoctor ? 'Practice details' : 'Facility details'}</legend>
              <div className="ops-field">
                <label htmlFor="ops-name">{isDoctor ? 'Doctor name' : 'Facility name'} <span className="ops-req">*</span></label>
                <input
                  id="ops-name"
                  ref={firstFieldRef}
                  type="text"
                  value={form.hospital_name}
                  onChange={setField('hospital_name')}
                  placeholder={isDoctor ? 'e.g. Dr. R. Kumar — Cardiologist' : 'e.g. Patna General Hospital'}
                  required
                />
              </div>
              <div className="ops-field">
                <label htmlFor="ops-address">Address</label>
                <input id="ops-address" type="text" value={form.address} onChange={setField('address')} placeholder="Street, city" />
              </div>
              <div className="ops-field-row">
                <div className="ops-field">
                  <label htmlFor="ops-email">Email</label>
                  <input id="ops-email" type="email" value={form.email} onChange={setField('email')} placeholder="reception@example.com" />
                </div>
                <div className="ops-field">
                  <label htmlFor="ops-contact">Contact number</label>
                  <input id="ops-contact" type="tel" value={form.contact_number} onChange={setField('contact_number')} placeholder="0612 000 0000" />
                </div>
              </div>
            </fieldset>

            <fieldset className="ops-fieldset">
              <legend className="ops-legend"><span className="ops-step">3</span> First admin account</legend>
              <p className="ops-help">This person manages the facility on MediZen and signs in with the phone number or email below.</p>
              {/* The backend stores admin_username as the admin's phone — it's their login ID. */}
              <div className="ops-field-row">
                <div className="ops-field">
                  <label htmlFor="ops-admin-phone">Admin phone number <span className="ops-req">*</span></label>
                  <input
                    id="ops-admin-phone"
                    type="tel"
                    value={form.admin_username}
                    onChange={setField('admin_username')}
                    placeholder="98765 43210"
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="ops-field">
                  <label htmlFor="ops-admin-email">Admin email</label>
                  <input
                    id="ops-admin-email"
                    type="email"
                    value={form.admin_email}
                    onChange={setField('admin_email')}
                    placeholder="admin@example.com"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="ops-field">
                <label htmlFor="ops-admin-password">Temporary password <span className="ops-req">*</span></label>
                <div className="ops-input-affix">
                  <input
                    id="ops-admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.admin_password}
                    onChange={setField('admin_password')}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="ops-icon-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
                <span className="ops-help">Share this with the admin securely.</span>
              </div>
            </fieldset>

            {formError && (
              <div className="ops-alert" role="alert">
                <Icon name="alert" size={16} /> {formError}
              </div>
            )}
          </div>

          <div className="ops-drawer-footer">
            <button type="button" className="ops-btn ops-btn-secondary" onClick={closeDrawer} disabled={submitting}>Cancel</button>
            <button type="submit" className="ops-btn ops-btn-primary" disabled={submitting}>
              {submitting ? 'Onboarding…' : 'Onboard facility'}
            </button>
          </div>
        </form>
      </aside>

      {toast && (
        <div className="ops-toast" role="status">
          <span className="ops-toast-icon"><Icon name="check" size={16} /></span>
          {toast}
          <button type="button" className="ops-icon-btn" onClick={() => setToast('')} aria-label="Dismiss">
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TseOpsOnboarding;
