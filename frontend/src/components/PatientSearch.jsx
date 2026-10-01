import React, { useState, useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';
import AddPatientModal from './AddPatientModal';

const GENDER_SHORT = { MALE: 'M', FEMALE: 'F', OTHER: 'O' };
const describe = (p) => [p.phone, p.age != null ? `${p.age}${GENDER_SHORT[p.gender] || ''}` : GENDER_SHORT[p.gender]]
  .filter(Boolean).join(' · ');

const PatientSearch = () => {
  const { searchPatients, setSelectedPatient, selectedPatient, lastBooking } = useBooking();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showModal, setShowModal] = useState(false);
  const wrapperRef = useRef(null);
  const requestRef = useRef(0);

  // Debounced server search; only the latest request's results are shown.
  useEffect(() => {
    const q = query.trim();
    if (selectedPatient || q.length < 2) {
      setResults([]);
      setIsOpen(!selectedPatient && q.length > 0);
      setSearching(false);
      return undefined;
    }
    const requestId = ++requestRef.current;
    setSearching(true);
    setSearchError('');
    const t = setTimeout(async () => {
      try {
        const found = await searchPatients(q);
        if (requestId !== requestRef.current) return;
        setResults(found);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (err) {
        if (requestId === requestRef.current) setSearchError(err.message);
      } finally {
        if (requestId === requestRef.current) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, searchPatients, selectedPatient]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Start fresh for the next patient once a booking is confirmed.
  useEffect(() => {
    if (lastBooking) setQuery('');
  }, [lastBooking]);

  const handleSelect = (patient) => {
    setSelectedPatient(patient);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setShowModal(true);
    setIsOpen(false);
  };

  const showAddOption = !searching && query.trim().length >= 2;

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    const lastIndex = results.length - (showAddOption ? 0 : 1);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, lastIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) handleSelect(results[highlightedIndex]);
      else if (showAddOption) handleAddNew();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="card w-full" style={{ position: 'relative' }} ref={wrapperRef}>
        <h3 className="text-lg font-semibold mb-2">1. Select Patient</h3>
        <div className="focus-ring" style={{ position: 'relative' }}>
          <input
            type="text"
            className="w-full"
            placeholder="Search by name or mobile number…"
            value={selectedPatient ? `${selectedPatient.full_name} - ${selectedPatient.phone}` : query}
            onChange={(e) => {
              if (selectedPatient) setSelectedPatient(null);
              setQuery(e.target.value);
            }}
            onFocus={() => query.trim() && !selectedPatient && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {isOpen && (
            <div className="search-results">
              {query.trim().length < 2 && <div className="search-item desk-muted">Type at least 2 characters…</div>}
              {searching && <div className="search-item desk-muted">Searching…</div>}
              {!searching && results.map((p, index) => (
                <div
                  key={p.patient_uid}
                  className="search-item"
                  style={{ backgroundColor: highlightedIndex === index ? 'var(--secondary)' : 'white' }}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="font-semibold">{p.full_name}</div>
                  <div className="text-muted desk-small">{describe(p)}</div>
                </div>
              ))}
              {showAddOption && (
                <div
                  className="search-item"
                  style={{ backgroundColor: highlightedIndex === results.length ? 'var(--secondary)' : 'var(--background)' }}
                  onClick={handleAddNew}
                  onMouseEnter={() => setHighlightedIndex(results.length)}
                >
                  <div className="font-semibold" style={{ color: 'var(--primary)' }}>+ Add new patient</div>
                  <div className="desk-small text-muted">
                    {results.length ? 'Not in the list? Register them.' : `No patient matches "${query.trim()}".`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {searchError && <div className="desk-error mt-2">{searchError}</div>}
        {selectedPatient && (
          <div className="desk-success mt-2">
            ✓ {selectedPatient.full_name} ({describe(selectedPatient)})
          </div>
        )}
      </div>
      <AddPatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialQuery={query.trim()}
        onCreated={handleSelect}
      />
    </>
  );
};
export default PatientSearch;
