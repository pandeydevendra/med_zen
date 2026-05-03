import React, { useState, useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';
import AddPatientModal from './AddPatientModal';

const PatientSearch = () => {
  const { searchPatients, setSelectedPatient, selectedPatient } = useBooking();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showModal, setShowModal] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchPatients(query));
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, searchPatients]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (patient) => {
    setSelectedPatient(patient);
    setQuery(patient.name);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setShowModal(true);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else if (results.length === 0 && query.trim()) {
        handleAddNew();
      }
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
            placeholder="Search name/phone (e.g. Rahul) or type new to add..." 
            value={selectedPatient ? selectedPatient.name + ' - ' + selectedPatient.phone : query}
            onChange={(e) => {
              if(selectedPatient) setSelectedPatient(null);
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {isOpen && (
            <div className="search-results">
              {results.map((p, index) => (
                <div 
                  key={p.id} 
                  className="search-item"
                  style={{ backgroundColor: highlightedIndex === index ? 'var(--secondary)' : 'white' }}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-muted text-sm">{p.phone}</div>
                </div>
              ))}
              {results.length === 0 && query.trim() && (
                <div 
                  className="search-item" 
                  style={{ backgroundColor: highlightedIndex === 0 ? 'var(--success)' : 'var(--background)', color: highlightedIndex === 0 ? 'white' : 'var(--text-main)' }}
                  onClick={handleAddNew}
                  onMouseEnter={() => setHighlightedIndex(0)}
                >
                  <div className="font-semibold">+ Add New Patient</div>
                  <div className="text-sm opacity-80">"{query}"</div>
                </div>
              )}
            </div>
          )}
        </div>
        {selectedPatient && (
          <div className="mt-2 text-success font-semibold">
            ✓ Patient Selected: {selectedPatient.name} ({selectedPatient.phone})
          </div>
        )}
      </div>
      <AddPatientModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        initialName={query} 
      />
    </>
  );
};
export default PatientSearch;
