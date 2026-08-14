# CA Firm Practice Management CRM — Build Specification

> **Purpose of this document:** This is a complete functional and technical specification intended to be fed to an AI coding assistant (e.g. Claude Code) so it can scaffold and build the product end-to-end. It replicates the full feature set of **Practive** (practive.in) — a practice management CRM for Chartered Accountant / CS / tax-practice firms in India — covering dashboard, task management, client management, billing, communication, document management (including document upload), client portal, employee management, to-dos, and reports.

---

## 1. Product Overview

**Product name:** (placeholder — e.g. "PraxisCA")

**One-liner:** An all-in-one practice management CRM built specifically for CA/CS/tax-practice firms in India — manage clients, recurring statutory compliance tasks, billing, document collection, team, and client communication (WhatsApp/Email/SMS) from one dashboard, with a branded self-service client portal.

**Primary users:**
- **Partner/Firm Admin** — full access: billing, employee management, reports, firm settings.
- **Staff/Article/Employee** — assigned tasks, to-dos, timesheets, limited client data.
- **Client (external, via portal)** — OTP-based login, view their own filings/ledger/documents, upload requested documents, make payments.

**Core value proposition:** Replace spreadsheets, WhatsApp groups, and email threads with one system that tracks every compliance task (GST, Income Tax, ROC, TDS), automates recurring filings, manages billing/invoicing, and gives clients a self-service portal to upload documents and track status.

---

## 2. Recommended Tech Stack

| Layer | Recommendation | Notes |
|---|---|---|
| Frontend (admin app) | React + TypeScript, Vite | Component library: shadcn/ui or MUI |
| Frontend (client portal / marketing site) | Next.js (SSR/SEO for public site) | Separate app or route group |
| Backend | Node.js (NestJS or Express) **or** FastAPI (Python) | Pick one; NestJS pairs well with TypeScript full-stack |
| Database | PostgreSQL | Relational data (clients, tasks, invoices, compliance calendar) fits well |
| ORM | Prisma (Node) or SQLAlchemy + Alembic (Python) | Use migrations from day one |
| Cache/Queue | Redis + BullMQ (Node) or Celery (Python) | For recurring task generation, reminders, WhatsApp/email sending |
| Auth | JWT (access + refresh tokens) + role-based access control (RBAC) | Separate auth flow for staff (password) vs clients (OTP) |
| File storage | S3-compatible object storage (AWS S3 / Cloudflare R2 / MinIO for local dev) | For documents, DSC files, attachments — **this is a core feature, not an afterthought** |
| Real-time | WebSockets (Socket.IO or native ws) | Notifications, live task updates |
| Messaging integrations | WhatsApp Business Cloud API, Email (SMTP/SendGrid/SES/Amazon SES), SMS gateway (e.g. MSG91/Twilio) | Templates + delivery logs |
| Payments | Razorpay / PhonePe / Cashfree | For online invoice payments and auto-receipts |
| External registry lookup | GST public search API (GSTN), MCA (ROC) data where available | For bulk client onboarding by GSTIN/PAN |
| Accounting export | Tally XML/JSON export format | For clients/services/invoices/receipts |
| Search | PostgreSQL full-text search (v1) → Meilisearch/Elasticsearch (v2) | For client/task search |
| Hosting | Docker containers on any cloud (AWS/GCP/Render/Railway, India region preferred for data residency) | docker-compose for local dev |
| CI/CD | GitHub Actions | Lint, test, build, deploy |

---

## 3. User Roles & Permissions (RBAC)

| Role | Scope |
|---|---|
| Super Admin | Full system access, billing entity setup, integrations, firm settings |
| Partner/Manager | Full operational access, reports, approvals |
| Staff/Employee/Article | Assigned tasks/to-dos only, own timesheet/attendance |
| Reviewer | Can verify/approve completed tasks before closure |
| Client (Portal) | Read-only + document-upload access to their own data only, via OTP auth |

Permissions should be **granular per module** (view/create/edit/delete/approve) and assignable per custom role, not just fixed roles.

---

## 4. Feature Modules

### 4.1 Dashboard
- Task highlights (by due date, overdue flagged in red)
- Task summary widget (counts by status: pending, in-progress, completed, overdue)
- **Statutory compliance calendar widget** — pre-loaded with recurring due dates (GSTR-1, GSTR-3B, TDS returns, Income Tax due dates, ROC annual filing, Advance Tax installments) with client-wise applicability
- Unbilled tasks & packages widget (revenue leakage prevention — flags completed work not yet invoiced)
- "Best performer" leaderboard (tasks completed per employee, time period filter)
- Quick links to create task / client / invoice

### 4.2 Task Management
**Task creation**
- One-click task creation; task templates by service type (GST Return Filing, ITR Filing, TDS Return, ROC Annual Filing, Tax Audit, Statutory Audit, etc.)
- Bulk client selection — assign one task definition to multiple clients at once (e.g. "File GSTR-3B for all GST-registered clients this month")
- Due date + target date (internal buffer vs statutory/client-facing deadline)
- Assign one or more responsible users
- Tags for filtering/grouping
- **Document request list attached directly to the task** — client uploads via portal fulfill the request automatically

**Automation**
- Recurring task engine: frequency = monthly / quarterly / half-yearly / yearly (matches GST/TDS/IT return cycles)
- Auto-assignment rules (by client, by service type, round robin, or fixed owner)
- Auto document-request trigger when a recurring task instance is generated (e.g. every month a GSTR-3B task auto-creates and auto-requests "Sales register" + "Purchase register" from the client)

**Task execution**
- Status workflow: Not Started → In Progress → Completed → Verified
- Reviewer/Partner verification step before a task is marked fully closed
- Built-in timer (start/stop/pause) that feeds the Timesheet module
- Sub-to-dos within a task for unplanned extra work
- **File attachments with a reusable template library** so working papers/checklists aren't re-uploaded every cycle

**Task detail / structure**
- Full task history/audit log (who changed what, when)
- Custom fields (firm-defined key/value fields per task type, e.g. "GSTIN," "ARN Number," "Acknowledgement Number")
- Checklists (ordered steps per compliance type)
- Notes with @mentions that trigger notifications
- Subtasks with independent assignees and due dates

### 4.3 Retainers (Fixed-Fee Client Agreements)
- Create a retainer: bundle of services (e.g. "Monthly GST + Annual ITR package"), fixed total amount, validity period (up to 12 months)
- Billing frequency: monthly / quarterly / half-yearly / yearly / one-time
- Auto-renewal toggle
- Per-retainer tracking of task completion status and billing/invoice status
- Ability to modify services or extend the period mid-cycle

### 4.4 Client Management
**Onboarding**
- Bulk import via Excel/CSV
- Bulk import via **GST public search API** (fetch legal name, address, registration date from GSTIN) to speed up onboarding
- Service package assignment at onboarding
- Assign a responsible internal user per client
- Client Groups (family, business group, or custom category) for grouped reporting/billing

**Client record**
- Snapshot/overview view (contact info, PAN, GSTIN(s), services, status, responsible user, outstanding balance)
- Flexible pricing: firm default price list + per-client overrides
- **Secure credential vault:** store login credentials for the GST portal, Income Tax e-filing portal, MCA/ROC portal, and Digital Signature Certificate (DSC) expiry tracking — **must be encrypted at rest, access-logged, masked in UI by default**
- Store client passwords/credentials for any external government portal (encrypted)

### 4.5 Finance / Billing
**Invoicing**
- Fast invoice: generate from a task, a package, an expense, or a fully custom line-item entry
- Auto-invoice: scheduled billing (weekly/monthly/quarterly/yearly) triggered on task completion
- Consolidated invoicing: bill multiple clients together under one "billing profile" (e.g. group companies)
- Credit notes linked against an existing invoice
- Support multiple billing entities (e.g. a CA firm with multiple partnership/LLP entities issuing invoices from one system)
- GST-compliant invoice format (HSN/SAC codes, CGST/SGST/IGST split, place of supply)

**Receipts**
- Manual receipt creation
- Auto-receipt generation on successful online payment
- Receipt-to-invoice settlement/reconciliation
- Configurable payment modes: Cash, UPI, Cheque, Bank Transfer, Online Gateway

**Expenses**
- Client-billable expenses (government fees, stamp duty, courier — paid on behalf of client, later added to an invoice)
- Internal office expenses (non-billable, for firm's own P&L visibility)
- Custom expense categories

**Reporting/export tools**
- Client ledger: date-range filter, print/download (PDF)
- Quotations/proforma invoices with accepted/rejected status tracking
- **Tally XML export** covering clients, services, invoices, receipts
- Payment gateway integration for client-facing online payment (Razorpay/PhonePe/Cashfree)

### 4.6 Communication
**WhatsApp**
- Connect firm's own WhatsApp Business number (via WhatsApp Cloud API)
- Reusable, pre-approved message templates
- Bulk send + automated triggers (task update, document request, payment reminder, invoice/receipt delivery, due-date reminders, festival/greetings)
- Message log with delivery/read status
- Optional AI chatbot layer: clients can self-serve on WhatsApp — download invoice/receipt/document, check outstanding balance, check filing status, switch between linked GSTINs/entities

**Email & SMS**
- Connect firm's own SMTP/sender ID, or use platform default sender
- Automated triggers (same event list as WhatsApp) + manual bulk send
- Delivery log

> **Design note:** Build a single internal "Notification/Communication Engine" service that all three channels (WhatsApp, Email, SMS) plug into, driven by an event bus (task.completed, invoice.created, payment.received, document.requested, due_date.approaching, etc.) so templates and triggers are managed in one place rather than duplicated per channel.

### 4.7 Document Management (Core Feature — Document Upload)

This is a first-class module, not a side feature. It must support both **digital document upload/exchange** and a **physical document in/out register**, since CA firms handle both.

**Digital document upload & storage**
- Client-facing **document upload via OTP-authenticated portal** — clients can upload files (PDF, Excel, images, ZIP) against a specific document request or freely to their document folder
- Staff-facing upload within any task (drag-and-drop, multi-file)
- Client-level document folder/tab — all documents for a client organized in one place, filterable by type/year/task
- Task-level document storage — documents tied to the specific compliance task that generated the request
- File type support: PDF, JPG/PNG, XLSX/XLS, DOCX, ZIP; configurable max file size per firm
- **Document categorization/tagging:** Financial Statements, Bank Statements, Purchase/Sales Register, TDS Certificates, PAN/Aadhaar/KYC, DSC, Agreements, Notices/Orders received from department, Filed returns/acknowledgements
- Version history when a document is re-uploaded (don't overwrite silently — keep prior versions accessible)
- Preview in-browser for PDF/image files without requiring download
- Bulk download (zip) of all documents for a client/task/period
- Access control: staff see all; clients see only their own; mentors/reviewers per permission level

**Auto document-request workflow**
- When a recurring task auto-generates (e.g. monthly GSTR-3B), the system automatically creates a document request list and notifies the client (via WhatsApp/Email) to upload the required documents
- Task shows real-time status: "3 of 5 requested documents received"
- Reminder automation for pending/overdue document requests

**Physical document register (Document In/Out)**
- Log physical documents received from or given to a client: document name, direction (in/out), status, date, location/custody, returnable flag, remarks
- Useful for original certificates, DSC tokens, signed physical agreements, cheque books, etc.
- Searchable log per client with outstanding (not-yet-returned) items flagged

**DSC (Digital Signature Certificate) tracking**
- Store DSC details per client: holder name, DSC class, issuing authority, expiry date
- Automated expiry reminder notifications (e.g. 30/15/7 days before expiry) to both staff and client
- Physical custody tracking (who holds the DSC token) via the Document In/Out register

### 4.8 Website & Client Portal
- Public marketing website generator for the firm (custom domain support)
- Website customization: logo, firm details, T&Cs, services list, contact info
- **OTP-based client login (phone/email OTP, no password)** to a portal where clients can:
  - View their filings/return status and history
  - View ledger and outstanding balance
  - **Upload documents** against open requests or freely
  - Download filed returns, invoices, and receipts
  - Make online payments against invoices
  - View DSC expiry status

### 4.9 Employee Management
- Add/remove employees; assign roles & permissions
- Attendance tracking: in/out time, present/absent/half-day/overtime, historical record
- Notifications: real-time alerts when a task or to-do is assigned
- Timesheet: daily work-hour logging (fed automatically by the task timer, editable manually), with productivity/time-insight views

### 4.10 To-Do (Internal, non-client-linked reminders)
- Auto-categorization by due date: Today / Upcoming / Completed
- Repeat to-dos on a chosen interval
- Assign to any team member
- Due dates with reminder notifications

### 4.11 Reports Centre
- **Financial reports:** invoices, receipts, expenses, outstanding balances, unbilled tasks/packages
- **Time reports:** raw time logs, client-wise time, employee-wise time, attendance summary
- **Client reports:** master data export, stored credentials/DSC expiry report
- **Task reports:** filterable task/service completion reports, compliance-calendar adherence report (on-time vs late filings)
- **Document reports:** pending document requests, document-in-out outstanding register
- All reports exportable to Excel/CSV; filters by date range, client, employee, status

---

## 5. Data Model (Core Entities)

This is a starting schema outline — expand with proper foreign keys, indexes, and soft-delete columns.

```
Firm (billing_entity) — id, name, domain, branding, settings
User (staff) — id, firm_id, name, email, role_id, password_hash, is_active
Role — id, firm_id, name, permissions (JSON or join table)
Client — id, firm_id, name, pan, gstin[], type, group_id, responsible_user_id, contact_info, custom_pricing
ClientGroup — id, firm_id, name
ClientCredential — id, client_id, portal_type (GST/IncomeTax/MCA/Other), username, encrypted_password
DscRecord — id, client_id, holder_name, dsc_class, issuing_authority, expiry_date, custody_status
Service — id, firm_id, name, default_price
Package — id, firm_id, name, service_ids[], price
Retainer — id, client_id, package_ids[], total_amount, billing_frequency, start_date, end_date, auto_renew
Task — id, firm_id, client_id, title, status, due_date, target_date, assignee_ids[], tags[], reviewer_id, recurrence_rule_id, retainer_id (nullable)
TaskChecklistItem — id, task_id, label, is_done
TaskSubtask — id, parent_task_id, title, assignee_id, status
TaskNote — id, task_id, author_id, body, mentioned_user_ids[]
TaskDocumentRequest — id, task_id, document_name, category, status, uploaded_document_id
TaskTimeLog — id, task_id, user_id, start_time, end_time, duration
RecurrenceRule — id, frequency, interval, next_run_date
ComplianceCalendarEntry — id, firm_id, name (e.g. GSTR-3B), applicable_to (client segment), due_date_rule
Invoice — id, firm_id, client_id (or billing_profile_id), line_items (JSON/child table), status, issue_date, due_date, hsn_sac, gst_breakup
BillingProfile — id, firm_id, name, client_ids[] (for consolidated invoicing)
CreditNote — id, invoice_id, amount, reason
Receipt — id, invoice_id (nullable), client_id, amount, mode, date
Expense — id, firm_id, client_id (nullable), category_id, amount, is_billable, attachment_id
ExpenseCategory — id, firm_id, name
Quotation — id, client_id, line_items, status (draft/sent/accepted/rejected)

Document — id, firm_id, client_id, task_id (nullable), category, file_url, file_type, size,
           version, uploaded_by, uploaded_by_type (staff/client), created_at
DocumentInOutLog — id, firm_id, client_id, direction (in/out), item_name, status, date, location, remarks

MessageTemplate — id, firm_id, channel (whatsapp/email/sms), name, body
MessageLog — id, firm_id, client_id, channel, template_id, status, sent_at
Attendance — id, user_id, date, in_time, out_time, status
Todo — id, firm_id, assignee_id, title, due_date, repeat_rule, status
Notification — id, user_id, type, payload, read_at
AuditLog — id, firm_id, entity_type, entity_id, action, actor_id, timestamp, diff
```

---

## 6. Key API Endpoints (Representative — expand per module)

```
Auth
POST   /api/auth/login                     (staff — email/password)
POST   /api/auth/refresh
POST   /api/auth/otp/request               (client portal)
POST   /api/auth/otp/verify

Clients
GET    /api/clients
POST   /api/clients
POST   /api/clients/import                 (bulk Excel import)
POST   /api/clients/import/gstin           (bulk import via GST public search API)
GET    /api/clients/:id
PATCH  /api/clients/:id
GET    /api/clients/:id/ledger
POST   /api/clients/:id/credentials        (store encrypted portal credential)
POST   /api/clients/:id/dsc                (add/update DSC record)

Tasks
GET    /api/tasks?status=&assignee=&client=&tag=
POST   /api/tasks                          (supports bulk client assignment)
PATCH  /api/tasks/:id
POST   /api/tasks/:id/verify
POST   /api/tasks/:id/timer/start
POST   /api/tasks/:id/timer/stop
POST   /api/tasks/recurring                (create recurrence rule)
GET    /api/compliance-calendar

Retainers
GET    /api/retainers
POST   /api/retainers
PATCH  /api/retainers/:id

Finance
POST   /api/invoices
POST   /api/invoices/auto-generate         (cron/queue-triggered)
POST   /api/invoices/:id/credit-note
POST   /api/receipts
POST   /api/expenses
GET    /api/reports/financial
GET    /api/export/tally

Communication
POST   /api/messages/whatsapp/send
POST   /api/messages/email/send
POST   /api/messages/sms/send
GET    /api/messages/log

Documents (core module)
POST   /api/documents/upload               (staff upload, multi-file)
POST   /api/documents/upload/client        (client portal upload, OTP-authenticated)
GET    /api/documents?client_id=&task_id=&category=
GET    /api/documents/:id/download
GET    /api/documents/:id/preview
POST   /api/documents/bulk-download        (zip export)
POST   /api/documents/in-out-log
GET    /api/documents/in-out-log?client_id=&status=outstanding
GET    /api/documents/pending-requests?task_id=

Employees
GET    /api/employees
POST   /api/employees/:id/attendance
GET    /api/employees/:id/timesheet

Todos
GET    /api/todos
POST   /api/todos

Reports
GET    /api/reports/tasks
GET    /api/reports/time
GET    /api/reports/clients
GET    /api/reports/documents

WebSocket events
task.updated, task.assigned, document.uploaded, document.requested, notification.new, message.delivered
```

---

## 7. Non-Functional Requirements

- **Multi-tenancy:** support multiple firms (tenants) with data isolation at the query layer (firm_id scoping on every table).
- **Security:** encrypt client credentials, DSC data, and sensitive documents at rest (AES-256); all API traffic over HTTPS; RBAC enforced server-side, not just hidden in UI; audit log for sensitive actions (viewing stored passwords, downloading documents, deleting invoices).
- **Data residency:** prefer hosting/storage regions in India given the target client base is Indian CA firms handling PAN/Aadhaar/financial data.
- **OTP auth:** rate-limit OTP requests, expire OTPs after ~5–10 minutes, lock out after repeated failures.
- **Document upload limits:** validate file type/size client- and server-side; scan uploads for malware before storage; generate signed, time-limited URLs for downloads rather than public file URLs.
- **Scalability:** background job queue for recurring task generation, bulk messaging, document-request reminders, and report generation so these don't block API requests.
- **Auditability:** every task/invoice/document change should be traceable (who/when/what).
- **Data export:** all major lists must be exportable to Excel/CSV; invoices/receipts/ledgers exportable to PDF; documents bulk-exportable as ZIP.
- **Notifications:** real-time (WebSocket) + fallback email/WhatsApp for assigned tasks, document requests, and DSC expiry.

---

## 8. Suggested Build Order (Milestones)

1. **Foundation:** auth (staff + client OTP), multi-tenant data model, RBAC, base UI shell/navigation.
2. **Client Management:** CRUD, bulk import (Excel + GSTIN lookup), groups, credential vault, DSC tracking.
3. **Document Management (core):** upload (staff + client), storage, categorization, preview, download, versioning — build this early since document exchange is central to the workflow.
4. **Task Management (core):** creation, assignment, status workflow, checklist/subtasks/notes, document requests wired into tasks.
5. **Task Automation:** recurrence engine, auto-assignment, auto document-request triggers, compliance calendar.
6. **Finance:** invoices (GST-compliant), receipts, expenses, ledger, quotations.
7. **Retainers:** fixed-fee packages layered on top of tasks + invoicing.
8. **Communication Engine:** unified event bus → WhatsApp/Email/SMS senders + templates + logs.
9. **Physical Document Register:** document in/out log, outstanding tracking.
10. **Client Portal + Website:** OTP login, ledger view, document upload/download, online payment.
11. **Employee module:** attendance, timesheet, notifications.
12. **To-Do module.**
13. **Reports Centre + exports (Excel/PDF/Tally XML).**
14. **Dashboard:** assemble widgets from data already built in prior milestones (build near the end, since it aggregates everything).
15. **Polish:** WhatsApp AI chatbot layer, payment gateway integration, DSC expiry automation, performance tuning.

---

## 9. Open Questions to Resolve Before/During Build

- Single-tenant (one firm only) or multi-tenant SaaS (many firms)?
- Which specific WhatsApp/SMS/payment gateway providers should be wired up first (e.g. MSG91 vs Twilio, Razorpay vs Cashfree)?
- Should the GST public search API be integrated for bulk onboarding in v1, or is manual/Excel import sufficient for MVP?
- Is a native mobile app in scope, or web-responsive only?
- What's the MVP feature cut for a first working demo? (Recommended: Client Management + Document Upload/Management + Task Management + Basic Invoicing + Dashboard.)
- Should Tally export be XML or the newer JSON-based Tally Connector format?

---

*This document is intended as a living spec — update it as scope decisions are made during development.*
