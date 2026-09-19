import React from 'react';

const TOC_LINKS = [
  { id: 'overview', label: 'What is MediZen?' },
  { id: 'roles', label: 'Switching demo roles' },
  { id: 'navigation', label: 'Sidebar navigation' },
  { id: 'assistant', label: 'Using the AI Assistant' },
  { id: 'support', label: 'Getting help' },
];

const Section = ({ id, title, children }) => (
  <div id={id} className="card mb-6">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="flex flex-col gap-3 text-sm" style={{ color: 'var(--text-main)', lineHeight: 1.6 }}>
      {children}
    </div>
    <a href="#top" className="help-back-link">↑ Back to top</a>
  </div>
);

const HelpDocs = () => {
  return (
    <div className="w-full" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <h2 id="top" className="text-2xl font-bold mb-6" style={{ color: 'var(--primary)' }}>
        📘 MediZen Help Docs
      </h2>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Contents</h3>
        <nav className="flex flex-col gap-1">
          {TOC_LINKS.map(link => (
            <a key={link.id} href={`#${link.id}`} className="help-toc-link">
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <Section id="overview" title="What is MediZen?">
        <p>
          MediZen is a clinic front-desk portal for booking appointments, tracking today's
          patient queue, and looking up doctor availability — with an AI assistant to answer
          quick questions about doctors, specialties, and fees.
        </p>
      </Section>

      <Section id="roles" title="Switching demo roles">
        <p>
          Use the role dropdown in the top bar (next to Logout) to switch between{' '}
          <strong>Receptionist</strong>, <strong>Doctor</strong>, and <strong>Admin</strong> views
          without logging out. The sidebar menu updates automatically to match what each role can see.
        </p>
      </Section>

      <Section id="navigation" title="Sidebar navigation">
        <p><strong>📅 New Appointment</strong> (Receptionist / Admin) — book a new patient appointment: search or add a patient, pick a doctor and time slot, then confirm.</p>
        <p><strong>🩺 Today's Queue</strong> (Doctor) — see the day's confirmed appointments for consultation.</p>
        <p><strong>🗂️ Patient Records</strong> and <strong>👨‍⚕️ Doctor Rosters</strong> (Admin) — placeholder sections for future management screens.</p>
        <p><strong>🤖 AI Assistant</strong> (all roles) — find and ask about doctors (see below).</p>
        <p><strong>⚙️ Settings</strong> (Admin) — placeholder for portal configuration.</p>
        <p>
          Click the <strong>⟨</strong> / <strong>☰</strong> button at the top-left to collapse or
          reopen the sidebar for more screen space.
        </p>
      </Section>

      <Section id="assistant" title="Using the AI Assistant">
        <p>
          The left panel lets you filter doctors by <strong>Specialty</strong> and{' '}
          <strong>Available day</strong>; click <strong>Refresh</strong> to reload the latest list
          from the server.
        </p>
        <p>
          The right panel is a chat where you can ask things like "Is Dr. Rao available on
          Monday?" or "List all doctors" — answers are generated from the same doctor data shown
          on the left, so they won't include anything not in the system.
        </p>
      </Section>

      <Section id="support" title="Getting help">
        <p>
          This is a demo environment — no real patient data is saved. For access issues or
          questions beyond this guide, contact your MediZen administrator.
        </p>
      </Section>
    </div>
  );
};

export default HelpDocs;
