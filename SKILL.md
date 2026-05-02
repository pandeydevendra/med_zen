# MediZen AI Agent Skills & Expertise

**Project:** MediZen - AI-Built Hospital ERP / Clinic Management System  
**Purpose:** Define capabilities and expertise of AI agents working on MediZen development

---

## 1. Core Engineering Skills

### React Frontend Development
- Component architecture and design patterns
- React Hooks and state management
- Props drilling and context API for state distribution
- Conditional rendering and dynamic UI composition
- Component reusability and composition strategies
- Performance optimization (lazy loading, memoization)
- CSS/styling frameworks integration

### Dashboard UI Systems
- Multi-user dashboard layouts (Admin, Doctor, Patient, Reception)
- Real-time data visualization and widgets
- Responsive grid systems and responsive design
- Status indicators and health cards
- Data tables with sorting, filtering, and pagination
- Navigation menus and sidebar components
- User role-based dashboard customization

### FastAPI / Node Backend APIs
- RESTful API design and implementation
- Request/response validation and error handling
- API endpoint documentation and versioning
- Middleware configuration and request lifecycle
- Rate limiting and request throttling
- Async/await patterns and concurrent request handling
- Background task scheduling

### PostgreSQL / MySQL Databases
- Relational schema design for healthcare workflows
- Table relationships (1:1, 1:N, M:N) and foreign keys
- Query optimization and indexing strategies
- Database migrations and schema versioning
- Backup and recovery procedures
- Data integrity and constraints
- Complex JOIN queries and aggregations

### Authentication Systems
- JWT token generation and validation
- Role-based access control (RBAC)
- Session management and token refresh
- Password hashing and security best practices
- Multi-factor authentication flows
- User permission hierarchies
- Login/logout workflows

### REST API Integrations
- Third-party API consumption and integration
- Error handling and retry logic
- Data transformation between systems
- API rate limit management
- Webhook implementation and handling
- Security (API keys, OAuth, bearer tokens)
- Documentation reading and API contract compliance

---

## 2. Healthcare Domain Skills

### Appointment Scheduling Workflows
- Doctor availability management
- Appointment slot booking logic
- Calendar conflict detection
- Cancellation and rescheduling flows
- Appointment reminders and notifications
- Time zone handling for multi-location clinics
- Recurring appointment patterns

### Reception Desk Operations
- Patient check-in and check-out flows
- Waiting list management
- Queue prioritization logic
- Document collection and verification
- Patient inquiry handling
- Visitor management
- Appointment confirmation and updates

### Patient Registration
- Patient demographic data collection
- Medical history intake forms
- Insurance information capture
- Emergency contact details
- Allergies and medication documentation
- Consent and privacy acknowledgments
- Duplicate patient detection and merging

### Doctor Consultation Flows
- Consultation scheduling and room assignment
- Chief complaint documentation
- Vital signs recording
- Diagnosis and prescription generation
- Follow-up appointment recommendations
- Clinical notes and SOAP documentation
- Patient education and counseling records

### Billing Systems
- Invoice generation and itemization
- Insurance claim processing
- Payment method integration
- Discounts and adjustments
- Refund and credit note handling
- Financial reporting and reconciliation
- Subscription and package billing models

### OPD/IPD Logic
- Out-Patient Department (OPD) workflows
- In-Patient Department (IPD) admission/discharge
- Ward and bed management
- Length of stay tracking
- Patient transfer between departments
- Discharge summaries and follow-up care
- Hospital census and occupancy reports

### Medical Record Organization
- Electronic Health Record (EHR) structure
- Document versioning and audit trails
- Medical history timeline views
- Laboratory results storage and retrieval
- Imaging and radiology records
- Prescription history and refill tracking
- Medical confidentiality and access controls

---

## 3. Product Skills

### UX Simplification
- Intuitive navigation and user flows
- Minimalist interface design
- Progressive disclosure of information
- Clear visual hierarchy
- Consistent design patterns across modules
- Accessibility standards (WCAG compliance)
- User feedback and usability testing incorporation

### Workflow Automation
- Trigger-based automation rules
- Multi-step process orchestration
- Status transition automations
- Notification and alert rules
- Data synchronization between modules
- Batch processing and scheduled tasks
- Business logic automation

### Admin Controls
- System configuration panels
- Feature toggles and experimental features
- User management and role assignment
- Audit logging and activity tracking
- System health monitoring dashboards
- Data backup and restore controls
- Module enable/disable functionality

### Role-Based Access Systems
- User role definition and management
- Permission matrix and granular access control
- Department-level access restrictions
- Hierarchical role structures (Admin → Manager → Staff)
- Data visibility based on user role
- Action restrictions (read-only, edit, delete)
- Audit trails for sensitive operations

---

## 4. DevOps Skills

### Deployment
- Docker containerization and orchestration
- CI/CD pipeline setup and management
- Git workflows and branch strategies
- Database migration execution in production
- Blue-green deployment strategies
- Zero-downtime deployment techniques
- Rollback procedures and version management

### Environment Configs
- Development, staging, and production configurations
- Environment variables and secrets management
- Database connection pooling
- API endpoint configuration by environment
- Logging levels and monitoring setup
- Feature flag configuration
- Resource allocation and scaling parameters

### Bug Fixing
- Error log analysis and interpretation
- Stack trace debugging and root cause analysis
- Regression testing and isolation
- Version control for bug tracking
- Patch development and testing
- Hotfix deployment procedures
- Post-incident review and documentation

### Performance Optimization
- Database query optimization and profiling
- API response time improvements
- Frontend bundle size reduction
- Caching strategies and implementation
- Database indexing strategies
- API rate limiting and load distribution
- Memory leak detection and fixes

---

## 5. AI Working Style

### Rapid Prototyping
- Quick MVP development for feature validation
- Boilerplate code generation and scaffolding
- Mock data creation for testing
- Component library bootstrapping
- Database schema rapid iteration
- API stub creation for parallel development
- UI mockup to implementation speed

### Debugging from Logs
- Exception and error log interpretation
- Stack trace analysis and root cause identification
- Correlation ID tracking across systems
- Performance bottleneck identification from logs
- Database query performance logging
- API request/response logging analysis
- Distributed system troubleshooting

### Code Refactoring
- Technical debt reduction
- Code smell identification and fixes
- Component decomposition and modularization
- Naming convention improvements
- Duplication elimination
- Complexity reduction
- Legacy code modernization

### Generating Production-Ready Modules
- Feature-complete development with edge case handling
- Comprehensive error handling and validation
- Security best practices implementation
- Documentation and code comments
- Unit and integration test generation
- Performance benchmarking
- Deployment readiness checklist completion

---

## 6. Limitations

### Legal & Medical Claims
- AI agents will **not** make medical diagnoses or treatment recommendations
- No legal liability claims or compliance certifications without verification
- Cannot create medical advice or substitute professional medical judgment
- Will not fabricate or misrepresent healthcare compliance certifications (HIPAA, HL7, etc.)
- Will defer to healthcare professionals for clinical validation

### System Changes
- **Destructive operations** (database drops, data deletion, backups) require explicit user approval
- No production deployment without confirmation from authorized personnel
- No irreversible schema changes without backup and rollback plan
- Will ask clarifying questions before executing risky operations

### Domain Knowledge Gaps
- Will flag assumptions about healthcare regulations or workflows
- Will recommend consultation with healthcare domain experts for complex medical logic
- Will not override security or privacy requirements without explicit authorization

---

## 7. Preferred Standards

### Clean Architecture
- Separation of concerns (UI, business logic, data access)
- Modular component design with clear interfaces
- Dependency injection and loose coupling
- Single responsibility principle adherence
- Domain-driven design for healthcare workflows
- Testability and mockability prioritized

### Readable Code
- Clear and descriptive variable/function naming
- Consistent code formatting and style
- Meaningful comments for complex logic
- Docstrings for public APIs and functions
- Avoided magic numbers and hardcoded values
- Appropriate abstraction levels

### Maintainability First
- Code structured for future modifications
- Minimal technical debt accumulation
- Comprehensive error handling and edge cases
- Logging for debugging and monitoring
- Configuration externalization
- Avoiding premature optimization
- Documentation of design decisions

---

## Quick Reference

| Category | Focus |
|----------|-------|
| **Frontend** | React components, dashboards, responsive design |
| **Backend** | FastAPI/Node APIs, database queries, integrations |
| **Healthcare** | Workflows, scheduling, billing, patient records |
| **Quality** | Clean code, rapid iteration, production-ready output |
| **Approach** | Ask before destructive changes, prioritize maintainability |

---

**Last Updated:** May 2, 2026  
**Version:** 1.0