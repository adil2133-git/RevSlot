RevSlot — Full Project Documentation (Complete, Updated)
1. Overview

RevSlot is a full-stack platform with two modules — Reviewer and Super Admin — built to replace a manual, WhatsApp-driven process for coordinating academic project reviews between external reviewers and advisors.

Previously: advisors manually picked a reviewer, manually shared a Google Meet link, and manually collected marks/feedback over WhatsApp. RevSlot automates the availability-sharing, booking, and feedback-collection parts.

No advisor login. No student login. Advisors interact entirely through reviewer-owned booking links.

2. Who uses it
Super Admin — manages reviewer accounts, oversight of availability and feedback, analytics, exports
Reviewer (external) — creates availability templates, creates booking links (Event Types), receives bookings, submits marks/feedback
Advisor — no account; accesses booking links directly to book reviews on behalf of interns
3. Reviewer module
3.1 Availability Templates

Reviewers create multiple named availability templates, each with:

Template Name — e.g. "review", "er", "ff", "weekend-only"
Days & Time Blocks — for each day (Mon–Sun):
Toggle day on/off (unavailable/available)
Add multiple time blocks per day (e.g. 9–10:30 AM, 3:30–5:30 PM)
Edit/delete individual blocks
Timezone — e.g. Asia/Kolkata

Each template is independent and reusable across event types.

3.2 Event Types (Booking Links)

Each reviewer creates multiple independent Event Types. Each has:

Event Name — e.g. "Individual Review", "Mock Interview", "Resume Review"
Booking URL (slug) — e.g. individual-review, mock-interview
Fixed Meeting Duration — user cannot change this
Availability Template — selected from reviewer's saved templates

Generated booking links:

revslot.com/individual-review
revslot.com/mock-interview
revslot.com/resume-review

Each event type is completely independent, but all share the same reviewer calendar for overlap prevention.

3.3 Vacation/Away Mode

A single toggle lets reviewers block out date ranges (holidays, exams, leave) — all event types show zero availability during blocked periods.

3.4 Question Banks

Reviewers can create multiple independent Question Banks with custom names:

"React", "JavaScript", "Node.js", "SQL", etc.

Each bank contains as many questions as the reviewer wants.

Usage:

Questions serve as a reference checklist while reviewing
Questions can be selected/attached to the feedback form being filled out
Only the reviewer sees Question Banks; advisors/interns cannot see them
3.5 Feedback Forms

Reviewers can create multiple custom feedback forms:

One default form provided by system
Can create additional forms with custom names
Each form has fixed base fields: Review Mark (1–10, decimals), Task Mark (1–10, decimals), Comments/Remarks
Reviewers can add custom fields to any form
When submitting feedback for a session, reviewer selects which form to use
3.6 Reviewer Dashboard sections
Event Types — create, edit, delete booking links
My Availability — create/edit availability templates
Question Banks — organize reference questions
Feedback Forms — create/customize form templates
Upcoming Sessions — includes Intern Review History suggestion, WhatsApp contact
Pending Feedback — completed sessions awaiting feedback
History — sessions with feedback already submitted
3.7 Intern Review History
Matches new sessions by Intern Name + Batch (exact match, no fuzzy matching)
If matched, shows suggestion in both Upcoming Sessions and the feedback form
Suggestion shows full timeline of all past reviews for that intern (marks + remarks)
Keeps suggesting every time — no dismissal/learning behavior
3.8 After a Session
Reviewer selects a feedback form, enters marks + remarks + custom fields
Review/confirmation screen before final submit
OR "Mark as No-show"
3.9 Required Reviewer Profile Fields
Name, email, WhatsApp number (mandatory)
Avatar, bio (optional)
3.10 Authentication Methods

RevSlot supports two authentication paths for reviewers, and one for admins.

Reviewers — Method A: Email/Password registration (OTP-verified)

Reviewer fills registration form (name, email, password, WhatsApp number)
On submit, an OTP is generated (email_verification purpose) and emailed — account is NOT created yet
Reviewer enters the OTP code
Only on successful verification is the account created, with email_verified = true from the start
A reviewer can never exist in an unverified state — verification is a precondition of account creation, not a follow-up

Reviewers — Method B: Google OAuth

Reviewer signs up/logs in via Google
Account created immediately, email_verified = true (Google already verified ownership — no OTP step)
password_hash remains null
WhatsApp number is not collected by Google — triggers a Profile Completion prompt (see 3.11)

Admins — email/password only

No Google OAuth for admins under any circumstance
Admin accounts are seeded manually (no public admin-registration endpoint)
3.11 Profile Completion Prompt (Google-registered reviewers only)
Google-registered reviewers land on the dashboard immediately (not blocked from logging in)
If whatsapp_number is missing, dashboard shows a profile completion popup/banner: "Complete your profile — add your WhatsApp number to start creating booking links."
(Open decision: soft reminder vs. hard block on creating Event Types — to be decided before UI build)
3.12 Forgot Password
Available only for email/password accounts (password_hash IS NOT NULL)
Not available for Google-only accounts — shown "This account uses Google Sign-In" instead
Flow: enter email → OTP (forgot_password purpose) sent → verified → set new password
4. Super Admin module
4.1 Reviewer Management
Add/edit/deactivate reviewer accounts, view profiles, monitor activity
4.2 Oversight Views
Read-only availability grid across all reviewers
Full feedback/marks history, search & filter by reviewer/date/status
4.3 Analytics Dashboard
Bookings per reviewer/week, no-show rate, feedback turnaround, most-booked reviewers/event types
4.4 Export
CSV/PDF export of feedback and marks history
4.5 Audit/Activity Log
Timestamped record of bookings, cancellations, reschedules, no-shows, form updates
Search & filter by action type, reviewer, date range
5. Advisor Flow (via Reviewer's Booking Links)
5.1 Booking Flow
Advisor opens booking link (e.g. revslot.com/individual-review)
Sees event name, fixed duration, reviewer timezone
Selects date → system generates valid time slots (availability template + duration + no overlap)
Selects slot → temporary hold (few minutes)
Fills form: Intern Name & Batch, Advisor Email, Current Week/Project Stage, Intern Email(s) optional
Confirms → slot locked immediately
On-screen confirmation + email sent (Resend/React Email)
5.2 Time Slot Generation Example

Availability: 9:00 AM – 12:00 PM · Duration: 50 min
Generated: 9:00, 9:50, 10:40
With existing 9:00–9:50 booking: 9:00 ❌, 9:50 ✅, 10:40 ✅

5.3 Cancellation & Rescheduling
Cancel: up to 3–4 hours before session; after cutoff, directed to WhatsApp
Reschedule: pick new slot (same/different event type), old slot auto-releases
5.4 Check My Bookings
Advisor enters email → OTP generated in Redis (check_bookings purpose, ~10 min TTL) → emailed → verified → bookings fetched from Postgres for that email (past + upcoming, across all event types)
No bookings found → "No bookings found"
Rate limiting on OTP requests handled in Redis
6. Email Service (Resend + React Email)

All emails sent via Resend using React Email templates, branded, send-only (noreply@revslot.com).

#	Trigger	Recipient(s)	Timing
1	Booking confirmed	Advisor, Intern (if given)	Immediately
2	OTP — check bookings	Advisor	Immediately
3	OTP — email verification	Reviewer (during registration)	Immediately
4	OTP — forgot password	Reviewer/Admin	Immediately
5	Availability reminder	Reviewer	Weekly Thu/Fri
6	Session reminder + Meet link	Reviewer, Advisor, Intern	~24h before
7	Final reminder	Reviewer, Advisor, Intern	~30min before
8	Booking cancelled	Reviewer	Immediately
9	Reviewer marked unavailable (mid-booking)	Advisor	Immediately
10	Booking rescheduled	Reviewer, Advisor, Intern	Immediately

Meet link generated ~24h before session (not at booking), stays fresh.

7. Booking Conflict Prevention

All event types for a reviewer share one calendar — a booking in any event type blocks that time slot across all others. No two bookings can overlap.

8. Reliability & Protection
Rate limiting on booking submissions and OTP requests
Temporary slot hold during form fill
Timezone-aware slot calculations (dayjs)
No-show marking
Meet link generated close to session time
Audit log for every action
OTP verification (Redis-backed, auto-expiring) for advisor self-service, registration, and password reset
9. Tech Stack
Frontend: Next.js 16 (React 19, TypeScript) — deployed on Vercel (revslot.com)
Backend: Separate Express + TypeScript API — deployed on AWS EC2 (Ubuntu 24.04 LTS, api.revslot.com)
State: Zustand (holds user + role only — no token storage, since JWT lives in httpOnly cookies)
Forms: React Hook Form + Zod
Styling: Tailwind CSS 4
HTTP Client: Axios (shared instance with refresh-token interceptor, request deduplication)
Dates: dayjs
Database: PostgreSQL, installed directly on EC2 (not publicly accessible), Drizzle ORM
Cache / OTP Store: Redis — used exclusively for OTP (generation, verification, rate limiting); to be set up post-MVP, before OTP features go live
Package Manager: pnpm monorepo (client, server)
Emails: Resend + React Email
Authentication: JWT via httpOnly cookies (reviewers/admins); Google OAuth for reviewers only; Redis-backed OTP for check-bookings, email verification, and forgot password
Process management: PM2 + Nginx (reverse proxy, HTTPS) on EC2
Region: AWS ap-south-1 (Mumbai)
Server folder structure: organized by module/domain (modules/booking/, modules/feedback/, modules/otp/, modules/auth/, etc.) — each module bundles its own controller, service, routes, schema, types, and DB/Redis access
10. Authentication Summary
reviewers and admins are separate tables — role implied by table, no shared user_role enum
password_hash is nullable on both tables (Google-authenticated reviewers have none)
google_id — nullable, unique — populated only for Google-signed-up reviewers; exists on admins for schema symmetry but is never used (admins are email/password only)
email_verified: always true at creation for both reviewer auth paths (OTP blocks non-Google account creation until verified; Google accounts are pre-verified)
OTP lives entirely in Redis (otp:{purpose}:{email}, TTL-based) — no Postgres otp_codes table
otp_purpose values: check_bookings, email_verification, forgot_password
11. Removed / Out of Scope
❌ Tech Stacks / stack tagging
❌ In-platform messaging (reviewer ↔ advisor)
❌ Multi-language support
❌ SMS reminders
❌ Super Admin–owned public link (ownership moved to reviewers via Event Types)
❌ OTP storage in Postgres (moved to Redis)
❌ Google OAuth for admins
12. Deployment Plan
Frontend: Vercel, revslot.com
Backend: AWS EC2, Ubuntu 24.04 LTS, Node.js + Express + TypeScript, PM2, Nginx, HTTPS, api.revslot.com
Database: PostgreSQL on the same EC2 instance, not publicly accessible (bound to localhost/private security group), Drizzle ORM
Redis: to be provisioned later, before OTP-dependent features (registration, forgot password, check-bookings) go live
Region: ap-south-1 (Mumbai)
Security group: ports 22 (SSH, IP-restricted), 80/443 only — 5432 never exposed
Backups: daily pg_dump to S3 (must be set up at deployment, not deferred)
Cookies: httpOnly, secure: true, sameSite: 'none', domain: '.revslot.com' for cross-subdomain auth between frontend and API
13. Planned Feature Roadmap

Phase 1 — Core features (MVP)

Availability Templates, Event Types, booking flow with overlap prevention
Feedback forms (default + customization), Question Banks
Check My Bookings (Redis OTP)
Reviewer auth: email/password (OTP-verified) + Google OAuth
Intern Review History

Phase 2 — Admin/Ops visibility

Analytics dashboard, Export (CSV/PDF), Audit log with search/filter

Phase 3 — Polish

Dark mode, mobile-responsive booking page
14. Open Questions / Flagged for Follow-up
Profile Completion prompt: soft reminder vs. hard block on Event Type creation until WhatsApp number is added — needs a decision before UI build
Admin email_verified handling — currently not gated by any self-serve flow since admins are seeded, not registered
15. Summary of Key Features

✅ Reviewer-owned booking links with independent event types
✅ Flexible, named, timezone-aware availability templates
✅ Atomic slot booking with conflict prevention across all event types
✅ Customizable feedback forms with default + custom fields
✅ Question banks for reviewer reference
✅ Intern review history with continuity suggestions
✅ Dual reviewer auth: OTP-verified email/password + Google OAuth
✅ Profile completion flow for Google-registered reviewers
✅ Redis-backed OTP for check-bookings, email verification, and password reset
✅ Branded transactional email via Resend + React Email
✅ Full audit trail
✅ Super Admin oversight, analytics, and exports
✅ Split Next.js (Vercel) frontend + Express (EC2) backend architecture
✅ No stacks/tags, no messaging, no multi-language — lean, focused MVP scope