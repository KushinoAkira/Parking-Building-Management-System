# AI USAGE REPORT

## SU26SWP08 — Parking Building Management System

---

| Document Information | |
|---|---|
| **Project Code** | SU26SWP08 |
| **Document Type** | AI Usage Report (Template 0) |
| **Version** | 1.0 |
| **Period** | Sprint 1 – Sprint Final (June – July 2026) |
| **Prepared By** | SU26SWP08 Development Team |

---

## 1. Summary

This document logs the integration of AI tools during the development of the PBMS project. Tool usage spanned architectural review, boilerplate generation, and testing scaffolding. All AI-generated code and documentation artifacts were manually reviewed by developers prior to project integration.

---

## 2. Tools Utilized

| Tool | Usage Scope | Cadence |
|---|---|---|
| GitHub Copilot | Inline code block completion, API DTO declaration | Daily |
| ChatGPT (GPT-4o) | Architectural pattern review, API structural feedback | Weekly |
| Claude (Anthropic) | Document outlining, code review assistance | Weekly |
| Cursor IDE | Refactoring operations, localized logic generation | Daily |

---

## 3. Contribution Log

### 3.1 Code Generation

| Component | AI Task | Developer Review Action |
|---|---|---|
| API Controllers | Scaffold fundamental CRUD routing | Integrated business logic and authorization attributes manually |
| DTOs | Generated property structures based on model | Validated variable types and attribute modifiers |
| Environment Setup | Generated `.gitignore` and `docker-compose` | Appended infrastructure-specific variables |
| PayOS Webhook | Scaffold initial HTTP request handler | Reviewed HMAC signature generation logic manually |
| React Navigation| Scaffold nested Route configuration | Corrected component imports and layout wrappers |

### 3.2 Testing Assistance

| Component | AI Task | Developer Review Action |
|---|---|---|
| xUnit Configuration | Generated initial InMemory db context wrapper | Verified dependency injection graph |
| Playwright | Generated basic login spec files | Mapped correct DOM selectors |

### 3.3 Documentation Assistance

| Document | AI Task | Developer Review Action |
|---|---|---|
| Markdown formatting | Applied table structures to markdown docs | Verified data accuracy against source code |

---

## 4. Usage Metrics

| Project Area | Estimated AI Drafting Ratio | Human Review Ratio |
|---|---|---|
| Basic Boilerplate / Controllers | 40% | 100% |
| Core Service Logic | 10% | 100% |
| Database Migrations | 0% | 100% |
| Frontend Component Structure | 30% | 100% |
| Documentation Outlines | 40% | 100% |

---

## 5. Security and Data Privacy Controls

AI tools were operated under the following constraints:
1. Production secrets, connection strings, and JWT keys were never included in prompt sets.
2. Code review feedback provided by AI was treated as advisory; implementation required manual test verification.
3. Logical discrepancies introduced during generation (hallucinations) were identified and discarded during peer review processes.
