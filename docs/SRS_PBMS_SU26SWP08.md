# SOFTWARE REQUIREMENTS SPECIFICATION

## Parking Building Management System (PBMS)

---

| Document Information | |
|---|---|
| **Project Code** | SU26SWP08 |
| **Project Name** | Parking Building Management System |
| **Document Type** | Software Requirements Specification (SRS) |
| **Document Version** | 1.0 |
| **Prepared By** | SU26SWP08 Development Team |
| **Date** | July 2026 |
| **Status** | Final |

---

## Document Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | June 2026 | Dev Team | Initial draft |
| 0.5 | June 2026 | Dev Team | Non-functional requirements and business rules |
| 1.0 | July 2026 | Dev Team | Final release |

---

## Table of Contents

1. Introduction
2. Overall Description
3. Stakeholders and User Classes
4. System Context
5. Functional Requirements
6. Non-Functional Requirements
7. Business Rules and Constraints
8. Use Case Catalog
9. Use Case Detailed Descriptions
10. User Stories
11. Assumptions and Dependencies
12. Traceability Matrix
13. Appendices

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) documents the functional and non-functional requirements for the Parking Building Management System (PBMS). It serves as the baseline for system design, implementation, and testing phases. 

PBMS manages daily parking operations, including vehicle entry/exit, slot allocation, fee calculation, digital payments, reservations, and analytics.

### 1.2 Scope

The system controls a 4-floor parking facility with an approximate capacity of 800 slots. 
- Floor 1 & 2: Motorbikes (Zones A–Z)
- Floor 3 & 4: Cars (Zones A–Z)
- Zones E–I across all floors are reserved for electric vehicles.

The application serves four primary roles: Admin, Manager, Staff, and Driver. It relies on a React frontend and an ASP.NET Core API backend.

### 1.3 Definitions and Abbreviations

| Term | Definition |
|---|---|
| PBMS | Parking Building Management System |
| JWT | JSON Web Token |
| OCR | Optical Character Recognition |
| EV | Electric Vehicle |
| VIP Slot | Premium slot subject to a surcharge |
| Session | Complete period from check-in to check-out |
| Reservation | Advance slot booking |

### 1.4 References

- PBMS Database Schema (database/pbms-schema.dbml)
- Frontend Flows Documentation (frontend_flows.md)

---

## 2. Overall Description

### 2.1 Product Perspective

PBMS is a discrete web application designed for a single parking facility. It interfaces with external services, specifically Google OAuth 2.0 (authentication), PayOS (payments), and PaddleOCR/PlateRecognizer (license plate validation).

### 2.2 Product Functions

- Authentication (Local and Google OAuth)
- Role-based Access Control
- Facility and Zone Management
- Vehicle Check-In/Out
- Real-Time Slot Mapping
- Fee Calculation & Payment Processing
- Digital Wallet Management
- Advance Reservations
- Incident Management
- Operational Dashboards

### 2.3 User Classes

- **Admin**: System configuration and user provisioning.
- **Manager**: Pricing, facility setup, and reporting.
- **Staff**: Operational check-in/check-out and direct customer interaction.
- **Driver**: Self-service tools including reservation, wallet top-up, and subscription purchasing.

---

## 3. System Context

| Interface | Type | Direction |
|---|---|---|
| Frontend to API | REST/JSON | Bidirectional |
| API to DB | EF Core/Npgsql | Bidirectional |
| API to Google | HTTPS | Outbound |
| API to PayOS | HTTPS | Outbound |
| PayOS to Webhook| HTTPS POST | Inbound |

---

## 4. Functional Requirements

### 4.1 Authentication (AUTH)

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-001 | Users authenticate via email and BCrypt-hashed password. | MUST |
| FR-AUTH-002 | Drivers can authenticate via Google OAuth 2.0. | MUST |
| FR-AUTH-003 | The system issues a JWT valid for 24 hours upon successful login. | MUST |
| FR-AUTH-004 | Internal roles (Admin, Manager, Staff) cannot use OAuth. | MUST |
| FR-AUTH-005 | API endpoints require valid JWT headers, excluding public routes. | MUST |
| FR-AUTH-006 | Login endpoints restrict requests to 8 per minute per IP. | MUST |

### 4.2 User Management (USER)

| ID | Requirement | Priority |
|---|---|---|
| FR-USER-001 | Admin creates and manages user accounts. | MUST |
| FR-USER-002 | Accounts can be locked to revoke access. | MUST |
| FR-USER-003 | The system enforces unique email addresses per user. | MUST |

### 4.3 Facility Management (MASTER)

| ID | Requirement | Priority |
|---|---|---|
| FR-MASTER-001 | Manager edits facility details (address, hours). | MUST |
| FR-MASTER-002 | System supports 5 vehicle classifications (Motorbike, Car, EV variants). | MUST |
| FR-MASTER-003 | Manager manages 104 zones across 4 floors. | MUST |
| FR-MASTER-004 | Slot position 1 in each zone acts as a VIP slot. | SHOULD |
| FR-MASTER-005 | Manager defines pricing policies (hourly rate, daily max, lost ticket fee). | MUST |

### 4.4 Real-Time Availability (SLOT)

| ID | Requirement | Priority |
|---|---|---|
| FR-SLOT-001 | The UI displays a live slot map grouped by floor and zone. | MUST |
| FR-SLOT-002 | Status states: Available, Occupied, Reserved, Maintenance, Locked. | MUST |
| FR-SLOT-003 | SignalR pushes status changes to clients immediately. | MUST |

### 4.5 Vehicle Check-In (CHECKIN)

| ID | Requirement | Priority |
|---|---|---|
| FR-CHECKIN-001 | Staff initiates entry via OCR or manual plate input. | MUST |
| FR-CHECKIN-002 | System validates no existing active session for the plate. | MUST |
| FR-CHECKIN-003 | System assigns the first available slot in the least-occupied matching zone. | MUST |
| FR-CHECKIN-004 | Staff can override the auto-assigned slot. | SHOULD |
| FR-CHECKIN-005 | Check-in creates a session record and marks the slot as Occupied. | MUST |
| FR-CHECKIN-006 | Operations run under a Serializable database transaction. | MUST |

### 4.6 Vehicle Check-Out (CHECKOUT)

| ID | Requirement | Priority |
|---|---|---|
| FR-CHECKOUT-001 | Staff queries sessions by TicketCode or plate. | MUST |
| FR-CHECKOUT-002 | Fee logic: ceil(hours) * hourly_rate (subject to daily cap). | MUST |
| FR-CHECKOUT-003 | Sessions under the configured grace period incur no fee. | MUST |
| FR-CHECKOUT-004 | Active subscription waives the parking fee. | MUST |
| FR-CHECKOUT-005 | VIP reservation triggers a flat surcharge. | MUST |
| FR-CHECKOUT-006 | System deducts e-wallet funds atomically. | MUST |
| FR-CHECKOUT-007 | System records payment, marks session Completed, and frees the slot. | MUST |

### 4.7 Reservations (RESERVE)

| ID | Requirement | Priority |
|---|---|---|
| FR-RESERVE-001 | Drivers book slots in advance. | MUST |
| FR-RESERVE-002 | Confirmed reservations change slot status to Reserved. | MUST |
| FR-RESERVE-003 | Unused reservations auto-expire via background service. | MUST |
| FR-RESERVE-004 | Check-in consumes the reservation successfully. | MUST |

### 4.8 Wallet (PAYMENT)

| ID | Requirement | Priority |
|---|---|---|
| FR-PAYMENT-001 | Drivers request wallet top-up via PayOS. | MUST |
| FR-PAYMENT-002 | System credits balance on receipt of PayOS valid webhook. | MUST |
| FR-PAYMENT-003 | Manager reviews aggregated payment data. | MUST |

### 4.9 Subscriptions (SUBSCRIPTION)

| ID | Requirement | Priority |
|---|---|---|
| FR-SUB-001 | Manager creates monthly plan tiers. | MUST |
| FR-SUB-002 | Driver purchases plan using wallet balance. | MUST |
| FR-SUB-003 | Subscriptions grant free exit to a specific plate. | MUST |

### 4.10 Incident & Feedback (INCIDENT)

| ID | Requirement | Priority |
|---|---|---|
| FR-INC-001 | Staff records violations (e.g., lost ticket, wrong zone). | MUST |
| FR-INC-002 | Manager resolves open incidents. | MUST |
| FR-FEED-001 | Drivers submit facility feedback. | SHOULD |

### 4.11 Reporting (REPORT)

| ID | Requirement | Priority |
|---|---|---|
| FR-RPT-001 | Manager accesses KPIs (revenue, occupancy). | MUST |
| FR-RPT-002 | System graphs 30-day revenue trends. | MUST |

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-PERF-001**: API response times < 500ms for read requests.
- **NFR-PERF-002**: Check-in/out completes < 2 seconds.
- **NFR-PERF-003**: System handles 50 concurrent active users.

### 5.2 Security

- **NFR-SEC-001**: Passwords hashed using BCrypt (cost=11).
- **NFR-SEC-002**: API enforces standard security headers (no-sniff, deny frame).
- **NFR-SEC-003**: PayOS webhooks validated via HMAC.
- **NFR-SEC-004**: Endpoints follow strict rate limits.

### 5.3 Reliability Architecture

- **NFR-REL-001**: Critical financial operations run in Serializable Isolation.
- **NFR-REL-002**: Expiry logic executes via background workers.

---

## 6. Business Rules

| ID | Rule |
|---|---|
| BR-001 | One active session maximum per license plate. |
| BR-002 | Occupied or Reserved slots cannot be assigned. |
| BR-003 | Fees map to the pricing policy active at check-out time. |
| BR-004 | Overtime fees apply only to periods beyond 24 hours. |
| BR-005 | E-wallet payments fail immediately if funds are insufficient. |

---

## 7. Traceability (Sample)

| FR ID | Feature | Affected Tables |
|---|---|---|
| FR-AUTH-001 | Login | Users |
| FR-CHECKIN | Check-in | ParkingSessions, ParkingSlots |
| FR-CHECKOUT | Checkout | Payments, ParkingSessions, ParkingSlots |
| FR-PAYMENT | Top-up | WalletTopUps, Users |

---

## Appendix A — Pricing Formula

```text
duration = ExitTime - EntryTime
if duration <= grace_period:
    return lost_ticket_fee (if applicable)

hours = ceil(duration.hours)
fee = hours * hourly_price
if fee > daily_cap: fee = daily_cap

total = fee + penalty_fee + vip_surcharge
if active_subscription: total = penalty_fee + vip_surcharge
```
