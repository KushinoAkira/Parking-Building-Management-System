# TESTING REPORT

## SU26SWP08 — Parking Building Management System

---

| Document Information | |
|---|---|
| **Project Code** | SU26SWP08 |
| **Document Type** | Testing Report (Template 5) |
| **Version** | 1.0 |
| **Period** | Sprint 1 – Sprint Final (June – July 2026) |
| **Prepared By** | SU26SWP08 Development Team |

---

## 1. Quality Assurance Strategy

Testing operations were conducted against internal business logic blocks, cross-boundary API interactions, and end-to-end browser flows.

### 1.1 Methodology
- **Unit and Integration Testing**: xUnit combined with Entity Framework Core InMemory providers for database isolation.
- **Endpoint Functional Testing**: HTTP `.http` file execution and Scalar API console validation.
- **End-to-End browser validation**: Playwright assertion sweeps across typical operational pathways.

---

## 2. Test Execution Records

### 2.1 Pricing Service Unit Testing

| TC ID | Objective | Input Parameters | Expected Outcome | Result |
|---|---|---|---|---|
| TC-PRC-001 | Validate Grace Period boundary | Duration = 14m, Grace = 15m | Fee = 0 | PASS |
| TC-PRC-002 | Calculate standard hourly rounding | Duration = 2.5h, Rate = 5,000 | Fee = 15,000 | PASS |
| TC-PRC-003 | Enforce daily cap logic | Duration = 12h, Cap = 50,000 | Fee = 50,000 | PASS |
| TC-PRC-004 | Apply subscription discount | Rate = 5,000, SubActive = true | Fee = 0 | PASS |

### 2.2 Integration Data Workflows

| TC ID | Objective | Procedure | Expected Outcome | Result |
|---|---|---|---|---|
| TC-INT-001 | Standard Check-In Sequence | Invoke CheckIn Async | Slot = Occupied; Session = Active | PASS |
| TC-INT-002 | Session Duplication Block | Secondary CheckIn (same plate) | Throw BusinessException | PASS |
| TC-INT-003 | Reservation Completion | CheckIn with Confirmed Reservation ID | Slot targets reserved assignment | PASS |
| TC-INT-004 | Background Auto-Expiry | Execute Expiry Scheduler | Expired reservations release slots | PASS |

### 2.3 System End-to-End Scenarios

| TC ID | Actor | Application Flow sequence | Outcome | Result |
|---|---|---|---|---|
| TC-E2E-001 | Staff | Staff Login → Open Dashboard → Input Plate → Auto Assign Slot → Monitor SignalR Event | Slot renders red (Occupied) | PASS |
| TC-E2E-002 | Driver | Driver Login → Execute Wallet Top-up → Select 50000 VND → Confirm Demo Flow | Balance reflects +50000 | PASS |
| TC-E2E-003 | Manager | Open Reporting Grid → Submit Check-out event parallelly | Dashboard metric increments | PASS |

---

## 3. Performance Profiling

Operations timed under controlled execution to validate compliance with NFRs.

| Measurement Class | Target Threshold | P50 Execution | P95 Execution | Status |
|---|---|---|---|---|
| API Standard Read Overhead | < 500 ms | 120 ms | 450 ms | PASS |
| Complex Database Transaction | < 2.0 s | 380 ms | 1.2 s | PASS |
| SignalR Broadcast Latency | < 2.0 s | N/A | 1.4 s | PASS |

---

## 4. Defect Management Summary

A cumulative 15 defects classified as Medium or higher were intercepted during system testing blocks. All logged defects were successfully triaged, remediated, and verified closing prior to final tag. 
Release candidate contains zero known blocking regression bugs.
