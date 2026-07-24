# SOFTWARE DESIGN SPECIFICATION

## Parking Building Management System (PBMS)

---

| Document Information | |
|---|---|
| **Project Code** | SU26SWP08 |
| **Document Type** | Software Design Specification (SDS) |
| **Version** | 1.0 |
| **Prepared By** | SU26SWP08 Development Team |
| **Date** | July 2026 |

---

## 1. Introduction

This Specification defines the target architecture, database schema, and interface contracts for the PBMS application. It aligns directly with the requirements outlined in the SRS.

### 1.1 Design Principles

1. **Separation of Concerns**: Decoupled Controllers, Services, and Repositories.
2. **Dependency Injection**: Interfaces used for component resolution, enabling stubbing and testing.
3. **Transaction Safety**: Serializable isolation applied to multiphase commits (e.g., wallet deduct + checkout).
4. **Fail-Closed Security**: Unhandled exceptions default to generic 500 status without exposing stack traces.

---

## 2. System Architecture

PBMS relies on a standard Layered client-server topology.

```text
CLIENT TIER               API TIER                          DATA TIER
───────────               ────────                         ─────────
React SPA ──────────────► API Controllers ────────────────► PostgreSQL
(Vite / Tailwind)         (Auth, Session, Wallet)           (Npgsql)
                          │
                          ▼
                       Services (Business Logic)
                          │
                          ▼
                       External Integrations (PayOS, Google, OCR)
```

The repository structure follows a standard monorepo design, dividing frontend source from backend API implementations and infrastructure automation.

---

## 3. Technology Stack

### 3.1 Backend environment

- ASP.NET Core Web API (.NET 10)
- Entity Framework Core 10
- PostgreSQL 14 via Npgsql
- SignalR for WebSockets
- JWT Authentication

### 3.2 Frontend environment

- React 18, Vite build
- Tailwind CSS
- Axios for HTTP calls

### 3.3 Hosted Infrastructure

- Containerized API on Railway.app
- Static assets on Firebase Hosting
- GitHub Actions for CI/CD

---

## 4. Backend Design

Controllers are strictly bound to HTTP routing, payload validation, and role assignment. Business logic delegates to scoped services.

**Key Services**:
- `ParkingSessionService`: Orchestrates check-in and check-out workflows. Requires database transactions.
- `PricingService`: Evaluates time deltas against active policies.
- `SlotAllocationService`: Determines optimal slot placement by floor load.
- `WalletService`: Coordinates with PayOS webhooks.

---

## 5. Database Schema

The database consists of 17 core tables.

### 5.1 Auth and Identity
- **Roles**: Admin, Manager, Staff, Driver.
- **Users**: Credentials, balances, OAuth references.

### 5.2 Facility Organization
- **VehicleTypes**: Master configurations. 
- **ParkingZones**: Grouping abstraction within floors.
- **ParkingSlots**: Discrete parking units mapped per zone.

### 5.3 Operational Core
- **ParkingSessions**: Primary ledger for physical presence.
- **Reservations**: Advance allocations.
- **Payments**: Audit records for final transactions.
- **WalletTopUps**: Track PayOS ledger states.

### 5.4 Management Extensions
- **PricingPolicies**: Active and historical rule structures.
- **Incidents**: Manual intervention tickets.
- **Subscriptions**: Term-based access logic.

---

## 6. API Guidelines

Endpoints adhere to REST constraints where applicable, using standard HTTP verbs and status codes. Auth headers (`Authorization: Bearer <token>`) are required globally.

**Selected Endpoints**:
- `POST /api/auth/login`
- `POST /api/parking-sessions/check-in`
- `POST /api/parking-sessions/{id}/check-out`
- `GET /api/reports/dashboard`
- `POST /api/portal/driver/{id}/wallet/top-up`

API error responses standard structure:
```json
{
  "error": "Error description text",
  "status": 400
}
```

---

## 7. Real-Time Interactions (SignalR)

SignalR hubs route messages to segmented groups to minimize unnecessary UI repaints.

- **Group `all`**: Slot state transitions (`slotUpdated`).
- **Group `operations`**: Incident alerts, management metrics (`dashboardRefresh`).
- **Group `driver:{id}`**: Target notifications (session end, wallet change).

---

## 8. Deployment Strategy

Code merged into the main branch triggers GitHub Actions jobs:
1. Lint and Test
2. Multi-stage Docker build targeting Railway deployment (API)
3. Node build targeting Firebase (SPA)

Environment secrets (database connection strings, API keys) remain injected at runtime via the hosting platform control panel.
