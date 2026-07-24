# ISSUES REPORT

## SU26SWP08 — Parking Building Management System

---

| Document Information | |
|---|---|
| **Project Code** | SU26SWP08 |
| **Document Type** | Issues Report (Template 4) |
| **Version** | 1.0 |
| **Period** | Sprint 1 – Sprint Final (June – July 2026) |
| **Prepared By** | SU26SWP08 Development Team |

---

## 1. Issue Register

| Issue ID | Title | Category | Severity | Status |
|---|---|---|---|---|
| ISS-001 | Concurrent check-in double slot assignment | Transaction | Critical | Resolved |
| ISS-002 | PaddleOCR exception on Linux target | Integration | High | Resolved |
| ISS-003 | PayOS signature mismatch | Integration | High | Resolved |
| ISS-004 | Google Auth inactive on production hosting | Configuration | High | Resolved |
| ISS-005 | SignalR broadcast failure to Driver client | Realtime | Medium | Resolved |
| ISS-006 | Reservation auto-expiry scheduler error | Background | Medium | Resolved |
| ISS-007 | Zero fee charged for exactly 1-hour session | Logic | Medium | Resolved |
| ISS-008 | EWallet double deduction condition | Transaction | Critical | Resolved |
| ISS-009 | Cross-Origin (CORS) policy block | Configuration | High | Resolved |
| ISS-010 | Manager dashboard timestamp offset | UI | Low | Resolved |

---

## 2. Issue Resolution Details

### ISS-001: Concurrent Check-In Synchronization
- **Description**: Simultaneous check-in requests generated duplicate Active session records for a single slot ID over separate threads.
- **Root Cause**: Database read/write isolated under lower isolation bounds, allowing dirty reads.
- **Resolution**: Implementation of explicit `ExecuteInTransactionAsync(IsolationLevel.Serializable)` around the check-in data context scope.

### ISS-002: PaddleOCR Environment Compatibility
- **Description**: Platform threw `DllNotFoundException` when deployed to Linux nodes.
- **Root Cause**: PaddleInference requires native Windows `.dll` build definitions not present in target environment.
- **Resolution**: Bound implementation to `OperatingSystem.IsWindows()`; injected stub service for Linux runtimes. Added web-based fallback endpoint parameters.

### ISS-003: PayOS Webhook Checksum Validation
- **Description**: Incoming webhooks systematically failed HMAC validation routines.
- **Root Cause**: Payload object properties serialized to string incorrectly (order mismatch).
- **Resolution**: Implemented custom payload flattening to sort keys alphabetically as required by PayOS security standards prior to computation.

### ISS-005: SignalR Hub Group Assignment
- **Description**: Slot map failed to trigger state updates on the Driver's viewport automatically.
- **Root Cause**: Driver connections lacked inclusion in the correct target broadcast group mapping.
- **Resolution**: Appended explicit `Groups.AddToGroupAsync` assignment in the Hub configuration for authenticated standard users.

---

## 3. Discovered Limitations

- **OCR Startup Constraint**: Initial PaddleOCR library initialization blocks the main thread for 8-12 seconds on the primary call. A background warmup sequence was deployed to mitigate latency post-startup.
- **Report Generation**: Execution of snapshot generation requires manual administrator trigger due to omission of automated CRON scheduling logic.
