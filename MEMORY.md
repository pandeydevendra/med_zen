# MediZen Project Memory

**Project:** MediZen - Hospital Management Platform  
**Status:** Active Development (AI-Assisted)  
**Last Updated:** May 2, 2026

---

## 1. Project Identity

### Core Definition
- **Name:** MediZen
- **Type:** Hospital Management ERP System
- **Purpose:** Comprehensive healthcare facility management platform
- **Development Model:** AI-assisted rapid development with modular architecture
- **Scope:** Clinic/Hospital operations, OPD, billing, staff management

### Key Characteristics
- Healthcare-focused workflow optimization
- Role-based multi-user system
- Production-ready, maintainable codebase
- Scalable from single clinic to multi-branch hospital

---

## 2. Current Priorities

### Phase 1 - Core Authentication & Access
- [ ] Receptionist login workflow
- [ ] Receptionist logout flow (stable)
- [ ] Role validation and permission checks
- [ ] Session management and token handling

### Phase 2 - Appointment Management
- [ ] Appointment booking system
- [ ] Modify/edit appointments
- [ ] Doctor appointment visibility
- [ ] Appointment scheduling validation
- [ ] Cancel appointment workflow

### Phase 3 - Stabilization
- [ ] Stable authentication system
- [ ] Consistent role-based access control
- [ ] Error handling and edge cases
- [ ] User feedback mechanisms

### Current Focus
**Receptionist workflows and appointment management** with production-ready authentication

---

## 3. Product Modules

### Receptionist Module
- Patient check-in/check-out
- Appointment booking and management
- Waiting list management
- Dashboard view of daily operations
- Patient inquiry handling

### Doctor Module
- Consultation schedule visibility
- Appointment view and confirmations
- Prescription generation
- Patient consultation notes
- Follow-up scheduling

### Admin Module
- System configuration
- User management and role assignment
- Department management
- Audit logs and activity tracking
- System health monitoring
- Feature toggles

### Billing Module
- Invoice generation
- Payment processing
- Insurance claim management
- Discount and adjustment handling
- Financial reports and reconciliation

### Patient Module
- Patient profile management
- Medical history access
- Appointment booking
- Prescription refill requests
- Medical record access

### Reports Module
- Daily census reports
- Appointment analytics
- Doctor utilization metrics
- Revenue and billing reports
- Patient satisfaction tracking

---

## 4. Known User Preferences

### Development Approach
- **Prompt-first mentality:** Concise, action-oriented requests preferred
- **Minimal explanation:** Get straight to implementation
- **Output conciseness:** Brief summaries over detailed narratives
- **Instruction-focused:** Clear requirements over open-ended suggestions

### Quality Expectations
- Production-ready code immediately
- No scaffolding or incomplete features
- Tested logic and edge case handling
- Clean, maintainable structure
- Performance optimized

### Communication Style
- Direct and factual
- Action-oriented responses
- Results-focused summaries
- Rapid iteration cycles

---

## 5. Technical Decisions

### Architecture
- **Frontend:** React with Vite bundler
- **Backend:** FastAPI or Node.js APIs
- **Database:** PostgreSQL/MySQL with relational schema
- **Deployment:** Docker containerization, CI/CD pipelines

### Design Patterns
- Modular component structure
- Role-based access control (RBAC)
- Context API for state management
- RESTful API design
- Separation of concerns

### Code Standards
- Clean architecture principles
- Reusable UI components
- Consistent naming conventions
- Comprehensive error handling
- Security-first implementation

### Authentication & Security
- JWT-based authentication
- Secure password hashing
- Role-based permission matrix
- Session token refresh logic
- Audit logging for sensitive operations

---

## 6. Known Risks & Issues

### Authentication System
- **Risk:** Login/logout flow inconsistencies
- **Risk:** Token expiration handling gaps
- **Risk:** Session state synchronization across tabs
- **Action:** Implement comprehensive auth flow testing

### Role Permissions
- **Risk:** Inconsistent role permission application across modules
- **Risk:** Module-level permission bypass vulnerabilities
- **Risk:** New roles missing default permissions
- **Action:** Centralize permission matrix; enforce at API level

### Workflows
- **Risk:** Incomplete appointment modification flows
- **Risk:** Missing cancel/reschedule edge cases
- **Risk:** Doctor visibility gaps for appointments
- **Action:** Map complete workflow state machine

### Known Bugs (Tracked)
- Receptionist logout may not clear session properly
- Role permissions not consistently enforced in all modules
- Incomplete error handling in appointment booking

---

## 7. Future Expansion

### Phase 4 - Extended Operations
- **Inventory Management:** Stock tracking, procurement workflows
- **Pharmacy Module:** Medicine management, prescription fulfillment
- **Billing Enhancements:** Insurance integration, advanced reporting

### Phase 5 - Analytics & Intelligence
- **Advanced Analytics:** Predictive patient analytics, trend analysis
- **Business Intelligence:** Dashboard insights, KPI tracking
- **Data Science:** Patient outcome predictions

### Phase 6 - Enhanced Services
- **Telemedicine:** Video consultation capabilities
- **Patient Portal:** Online appointment booking, medical record access
- **Mobile Apps:** iOS/Android native applications

### Phase 7 - Scalability
- **Multi-branch Support:** Multi-location management
- **Enterprise Features:** Advanced permission hierarchies
- **Integration:** Third-party ERP/billing system connectivity

---

## Quick Reference

| Aspect | Status |
|--------|--------|
| **Auth System** | In Progress - Needs Stabilization |
| **Receptionist Module** | Active Development |
| **Appointment System** | Core Features In Development |
| **Doctor Module** | Initial Phase |
| **Admin Controls** | Foundational |
| **Billing** | Planned |
| **Infrastructure** | React + FastAPI/Node + PostgreSQL |

---

## Important Reminders

### Do NOT
- Make medical/legal claims without verification
- Fabricate compliance certifications
- Deploy to production without approval
- Execute destructive operations without confirmation

### ALWAYS
- Ask before breaking changes
- Test role permissions across modules
- Validate authentication flows end-to-end
- Document technical decisions
- Keep this memory updated with discoveries

---

## Contact & Escalation

**Project Lead:** [To be specified]  
**Tech Lead:** [To be specified]  
**Update Frequency:** After each major decision or discovery

---

**Version:** 1.0  
**Maintainer:** AI Development Team  
**Next Review:** [Set during sprint planning]