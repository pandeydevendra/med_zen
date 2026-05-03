export const mockDoctors = [
  { id: 'd1', name: 'Dr. Ramesh Sharma', department: 'General Medicine', available: true, status: 'On Time', delay: 0 },
  { id: 'd2', name: 'Dr. Sunita Patel', department: 'Pediatrics', available: true, status: 'Running 10 min late', delay: 10 },
  { id: 'd3', name: 'Dr. Anil Kumar', department: 'Orthopedics', available: false, status: 'On Leave', delay: 0 },
  { id: 'd4', name: 'Dr. Priya Desai', department: 'Cardiology', available: true, status: 'On Time', delay: 0 },
  { id: 'd5', name: 'Dr. Vikram Singh', department: 'ENT', available: true, status: 'Emergency Busy', delay: 0 }
];

export const mockSlots = [
  { id: 's1', time: '09:00 AM', available: true },
  { id: 's2', time: '09:30 AM', available: true },
  { id: 's3', time: '10:00 AM', available: false },
  { id: 's4', time: '10:30 AM', available: true },
  { id: 's5', time: '11:00 AM', available: true },
  { id: 's6', time: '11:30 AM', available: true }
];

export const mockPatients = [
  { id: 'p1', name: 'Rahul Gupta', phone: '9876543210', age: 35, gender: 'Male' },
  { id: 'p2', name: 'Sneha Verma', phone: '9123456780', age: 28, gender: 'Female' },
  { id: 'p3', name: 'Amit Jain', phone: '9988776655', age: 42, gender: 'Male' }
];

export const mockQueue = {
  currentToken: 24,
  waiting: 7,
  avgWait: 15
};

export const mockAppointments = [
  { id: 'a1', patient: mockPatients[0], doctor: mockDoctors[0], slot: mockSlots[0], status: 'Confirmed', token: 25 },
  { id: 'a2', patient: mockPatients[1], doctor: mockDoctors[1], slot: mockSlots[1], status: 'Confirmed', token: 26 }
];
