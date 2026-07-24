# PBMS Project Documentation Index

## SU26SWP08 — Parking Building Management System

---

All documents generated from complete source code analysis. Each document is 100% based on the actual codebase — no generic content.

---

## Generated Documents

| # | Document | File | Size | Description |
|---|---|---|---|---|
| 1 | **SRS** — Software Requirements Specification | [SRS_PBMS_SU26SWP08.md](./SRS_PBMS_SU26SWP08.md) | ~50KB | Complete functional + non-functional requirements, 70+ FRs, 28 use cases, 10 user stories, traceability matrix |
| 2 | **SDS** — Software Design Specification | [SDS_PBMS_SU26SWP08.md](./SDS_PBMS_SU26SWP08.md) | ~65KB | Full architecture, all 17 DB table designs, API contract (75+ endpoints), service layer design, security, deployment topology |
| 3 | **AI Usage Report** | [AI_Usage_Report_PBMS_SU26SWP08.md](./AI_Usage_Report_PBMS_SU26SWP08.md) | ~9KB | Tool-by-tool AI usage log, ratio analysis, hallucinations detected, responsible AI practices |
| 4 | **Issues Report** | [Issues_Report_PBMS_SU26SWP08.md](./Issues_Report_PBMS_SU26SWP08.md) | ~10KB | 15 resolved issues (Critical→Low), root causes, resolutions, risk register |
| 5 | **Testing Report** | [Testing_Report_PBMS_SU26SWP08.md](./Testing_Report_PBMS_SU26SWP08.md) | ~16KB | 109 test cases (100% pass), performance benchmarks, Playwright E2E results |
| 6 | **User Manual** | [User_Manual_PBMS_SU26SWP08.md](./User_Manual_PBMS_SU26SWP08.md) | ~19KB | Step-by-step guides for Admin, Manager, Staff, Driver |

---

## Project Quick Reference

### Technology Stack
- **Backend**: ASP.NET Core Web API (.NET 10) — Railway (Docker)
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS — Firebase Hosting
- **Database**: PostgreSQL 14 — Railway managed
- **Real-time**: ASP.NET Core SignalR (WebSocket)
- **Payment**: PayOS (QR/bank transfer + webhook)
- **OCR**: PaddleOCR (Windows) / Plate Recognizer browser fallback (Linux)
- **Auth**: JWT + BCrypt + Google OAuth 2.0

### Facility Scale
- 4 floors: F1–F2 motorbike (300 slots each), F3–F4 car (100 slots each)
- 104 zones total (26 per floor), zones E–I = electric vehicle zones
- 800 total parking slots; first slot in each zone = VIP

### Demo Accounts
| Email | Password | Role |
|---|---|---|
| admin@parking.com | Admin@123 | Admin |
| manager@parking.com | Manager@123 | Manager |
| staff@parking.com | Staff@123 | Staff |
| user@parking.com | User@123 | Driver |

### Default Pricing
| Vehicle Type | Per Hour | Daily Max | Lost Ticket |
|---|---|---|---|
| Motorbike | 5,000 VND | 50,000 VND | 20,000 VND |
| Car | 20,000 VND | 200,000 VND | 50,000 VND |
| EV Motorbike | 6,000 VND | 60,000 VND | 20,000 VND |
| EV Car | 25,000 VND | 250,000 VND | 20,000 VND |

### Subscription Plans (Default)
| Plan | Vehicle | Duration | Price |
|---|---|---|---|
| Vé tháng xe máy | Motorbike | 30 days | 300,000 VND |
| Vé tháng ô tô | Car | 30 days | 1,500,000 VND |
