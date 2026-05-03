import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { mockDoctors, mockSlots } from '../mockData';

const DoctorAvailability = () => {
  const { selectedDoctor, setSelectedDoctor, selectedSlot, setSelectedSlot, selectedPatient } = useBooking();
  const [activeTab, setActiveTab] = useState('All');

  const departments = ['All', ...new Set(mockDoctors.map(d => d.department))];
  const filteredDocs = activeTab === 'All' ? mockDoctors : mockDoctors.filter(d => d.department === activeTab);

  const handleDoctorClick = (doc) => {
    if (!doc.available) return;
    setSelectedDoctor(doc);
    // Auto-select next available slot
    const nextSlot = mockSlots.find(slot => slot.available);
    if (nextSlot) setSelectedSlot(nextSlot);
  };

  const getSlotStatus = (slot, doc) => {
    if (selectedDoctor?.id === doc.id && selectedSlot?.id === slot.id) return 'selected';
    if (!slot.available) return 'booked';
    return 'available';
  };

  const getStatusColor = (status) => {
    if (status === 'On Time') return 'var(--success)';
    if (status.includes('late')) return 'var(--warning)';
    if (status === 'On Leave' || status === 'Emergency Busy') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className={`card w-full ${!selectedPatient ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s', opacity: !selectedPatient ? 0.6 : 1, pointerEvents: !selectedPatient ? 'none' : 'auto'}}>
      <h3 className="text-lg font-semibold mb-4">2. Select Doctor & Slot</h3>
      
      <div className="flex gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {departments.map(dept => (
          <button 
            key={dept}
            onClick={() => setActiveTab(dept)}
            className="btn-outline"
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              backgroundColor: activeTab === dept ? 'var(--primary)' : 'white',
              color: activeTab === dept ? 'white' : 'var(--text-main)',
              border: activeTab === dept ? 'none' : '1px solid var(--border)'
            }}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem'}}>
        {filteredDocs.map(doc => {
          const isDocSelected = selectedDoctor?.id === doc.id;
          return (
            <div 
              key={doc.id} 
              className="p-4 border rounded" 
              style={{ 
                borderColor: isDocSelected ? 'var(--primary)' : 'var(--border)', 
                borderStyle: 'solid', 
                borderWidth: isDocSelected ? '2px' : '1px',
                cursor: doc.available ? 'pointer' : 'default',
                backgroundColor: isDocSelected ? '#eff6ff' : 'white'
              }}
              onClick={() => handleDoctorClick(doc)}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-semibold text-lg">{doc.name}</div>
                  <div className="text-muted text-sm">{doc.department}</div>
                </div>
                <div className="text-right">
                  {!doc.available && <span className="text-danger font-semibold">UNAVAILABLE</span>}
                  {doc.available && (
                    <div style={{ color: getStatusColor(doc.status), fontSize: '0.875rem', fontWeight: '500' }}>
                      {doc.status}
                    </div>
                  )}
                </div>
              </div>
              
              {doc.available && (
                <div className="slot-grid">
                  {mockSlots.map(slot => {
                    const status = getSlotStatus(slot, doc);
                    const isHighlighted = status === 'available' && !selectedSlot && slot === mockSlots.find(s => s.available);
                    return (
                      <button 
                        key={slot.id}
                        className={`slot-btn ${status}`}
                        style={{
                          backgroundColor: status === 'selected' ? 'var(--primary)' : status === 'booked' ? 'var(--muted)' : isHighlighted ? '#e0f2fe' : 'white',
                          color: status === 'selected' ? 'white' : status === 'booked' ? 'var(--text-muted)' : 'var(--text-main)',
                          border: isHighlighted ? '2px solid var(--primary)' : '1px solid var(--border)'
                        }}
                        disabled={status === 'booked'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctor(doc);
                          setSelectedSlot(slot);
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DoctorAvailability;
