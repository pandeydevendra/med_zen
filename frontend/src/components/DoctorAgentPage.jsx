import React from 'react';
import DoctorFilterPanel from './DoctorFilterPanel';
import DoctorAgentChat from './DoctorAgentChat';

const DoctorAgentPage = () => {
  return (
    <div className="agent-page">
      <div className="agent-page-left">
        <DoctorFilterPanel />
      </div>
      <div className="agent-page-right">
        <DoctorAgentChat />
      </div>
    </div>
  );
};

export default DoctorAgentPage;
