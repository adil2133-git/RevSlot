RevSlot — Full Project Documentation (Final, Updated)
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

"React"
"JavaScript"
"Node.js"
"SQL"
etc.

Each bank contains as many questions as the reviewer wants.

Usage:

Questions serve as a reference checklist while reviewing
Questions can be selected/attached to the feedback form being filled out
Only the reviewer sees Question Banks; advisors/interns cannot see them
3.5 Feedback Forms

Reviewers can create multiple custom feedback forms:

One default form provided by system
Can create additional forms with custom names
Each form has fixed base fields:
Review Mark (1–10, with decimals like 6.5, 8.5)
Task Mark (1–10, with decimals)
Comments/Remarks
Reviewers can add custom fields to any form
When submitting feedback for a session, reviewer selects which form to use
3.6 Reviewer Dashboard sections
Event Types — create, edit, delete booking links with their durations/availability templates
My Availability — create, edit, manage availability templates with multiple time blocks per day
Question Banks — create, organize, reference questions by topic
Feedback Forms — create and customize feedback form templates
Upcoming Sessions — bookings coming up
Shows intern name & batch, advisor email, current week/project stage
Intern Review History suggestion — if this intern (name+batch) has been reviewed before, shows: "This might be someone you've reviewed before: [Name] [Batch] — X past reviews. View history?"
Shows WhatsApp contact info attached to booking
Pending Feedback — sessions completed but feedback not yet submitted
History — past sessions with feedback already submitted
3.7 Intern Review History

Triggering:

System matches new sessions by Intern Name + Batch
If a match exists in reviewer's past feedback, shows suggestion in both:
"Upcoming Sessions" dashboard
While filling new feedback form

What's shown:

Full timeline of all past reviews for that intern
Previous marks (review + task)
Previous remarks/comments from feedback
No learning/dismissal — keeps suggesting on future bookings

Behavior:

Exact name+batch match only, no fuzzy matching
Suggestions appear in both places (upcoming session view + feedback form sidebar)
Reviewer can click to view, but interaction is optional
3.8 After a Session
Reviewer fills a form:
Selects which feedback form to use
Enters marks (review + task) with decimals
Enters remarks/comments
Fills custom form fields
Review/confirmation screen summarizes entered data before final submission
Must explicitly confirm before submission (catches typos/mistakes)
OR "Mark as No-show" if intern/advisor never joined
3.9 Required Reviewer Profile Fields
Name, email
WhatsApp number (mandatory) — fallback if reviewer doesn't show on Meet
Avatar, bio (optional)

(Tech stacks / stack tagging removed — not part of current scope)

4. Super Admin module
4.1 Reviewer Management
Add/edit/deactivate reviewer accounts
View reviewer profiles and contact info
Monitor reviewer activity
4.2 Oversight Views
Availability grid — read-only view of all reviewers' availability across all event types
Feedback history — browse all submitted marks/feedback across reviewers
Search & filter — by reviewer, date range, feedback status
4.3 Analytics Dashboard
Bookings per reviewer / per week
No-show rate (overall + per reviewer)
Average turnaround time from session completion to feedback submission
Most-booked reviewers / busiest event types
4.4 Export
CSV/PDF export of feedback and marks history for institutional records
4.5 Audit/Activity Log
Timestamped record of: bookings, cancellations, reschedules, no-shows, form updates
Search & filter by action type, reviewer, date range
5. Advisor Flow (via Reviewer's Booking Links)
5.1 Booking Flow
Advisor receives a booking link (e.g. revslot.com/individual-review)
Opens link → sees event details:
Event Name
Duration (fixed, not selectable)
Reviewer timezone
Selects a date
System generates available time slots based on:
Reviewer's availability template for that event type
Fixed meeting duration
Existing bookings (no overlap allowed)
Timezone conversion
Selects a time slot → temporary hold (few minutes)
Fills booking form:
Intern Name & Batch
Advisor Email (auto-filled if returning)
Current Week / Project Stage
Intern Email(s) — optional
Confirms → slot locked immediately
On-screen confirmation (date, time, reviewer name, timezone)
Confirmation email sent (via Resend, React Email template, branded)
5.2 Time Slot Generation Example

Availability Template: 9:00 AM – 12:00 PM (Asia/Kolkata)
Meeting Duration: 50 minutes

Generated slots (in advisor's timezone):

9:00 AM
9:50 AM
10:40 AM

With existing booking (9:00–9:50 AM):

9:00 AM ❌ (conflicts)
9:50 AM ✅ (valid)
10:40 AM ✅ (valid)
5.3 Cancellation & Rescheduling

Cancel:

Usable up to 3–4 hours before session
After cutoff: in-app message directs advisor to contact reviewer via WhatsApp
On cancellation: slot reopens immediately, reviewer notified

Reschedule:

From confirmation email or "Check My Bookings" page
Advisor picks new date/time (same or different event type)
Old slot reopens automatically once new slot confirmed
5.4 Check My Bookings (OTP now via Redis)
Separate page for advisors to manage bookings without login
Flow:
Advisor enters their email
OTP generated, stored in Redis (TTL-based, ~10 min expiry), and emailed via Resend
Advisor enters code → verified against Redis
On success, all bookings (past + upcoming) fetched from Postgres for that email
If no bookings for that email: "No bookings found"
Rate limiting on OTP requests handled in Redis (e.g. max 3 requests per email per 15 min)
No cleanup job needed for expired OTPs — Redis TTL handles it automatically
6. Email Service (Resend + React Email)

All emails sent via Resend using React Email templates with brand styling.

#	Trigger	Recipient(s)	Content	Timing
1	Booking confirmed	Advisor, Intern (if given)	Event name, date, time, reviewer name, WhatsApp link — no Meet link yet	Immediately
2	OTP requested	Advisor	OTP code for "Check My Bookings"	Immediately
3	Availability reminder	Reviewer	"Confirm or edit next week's availability"	Weekly Thu/Fri
4	Session reminder + Meet link	Reviewer, Advisor, Intern (if given)	Event details, Meet link, reviewer's WhatsApp link	~24 hours before
5	Final reminder	Reviewer, Advisor, Intern (if given)	Same Meet link, WhatsApp link, "starting soon"	~30 minutes before
6	Booking cancelled	Reviewer	Which session cancelled, slot reopened	Immediately
7	Reviewer marked unavailable (mid-booking)	Advisor	Session cancelled by reviewer, fallback options	Immediately
8	Booking rescheduled	Reviewer, Advisor, Intern (if given)	Old slot released, new date/time confirmed	Immediately

Key design:

Meet link generated ~24 hours before (not at booking), stays fresh
Emails are send-only from noreply@revslot.com (no reply management)
All emails branded with RevSlot logo and colors
React Email templates for maintainability and customization
7. Booking Conflict Prevention

All booking links for a reviewer share the same calendar:

When an advisor books a slot in "Individual Review" (50 min), it blocks that time across all other event types
System generates time slots dynamically, filtering out any that overlap with any existing booking
No two bookings can overlap, regardless of event type or duration
8. Reliability & Protection
Rate limiting on booking submissions
Temporary slot hold during form fill (few minutes)
Timezone-aware slot display and calculations (using dayjs)
No-show marking keeps feedback data clean
Meet link generated close to session time, not at booking
Audit log for every action (booking, cancel, reschedule, no-show, form edit)
OTP verification for advisor self-service access (Redis-backed, auto-expiring)
9. Tech Stack
Frontend + API: Next.js 16 (React 19, TypeScript) — full-stack framework; API routes handle most request logic
State: Zustand
Forms: React Hook Form + Zod
Styling: Tailwind CSS 4
HTTP Client: Axios
Dates: dayjs (timezone handling, slot calculations)
Database: PostgreSQL (Drizzle ORM, drizzle-orm/node-postgres + pg Pool)
Cache / OTP Store: Redis — used exclusively for OTP generation/verification (auto-expiring TTL, no manual cleanup)
Package Manager: pnpm (monorepo workspace: client, server, shared)
Emails: Resend + React Email
Background jobs / services: Node.js service layer (server/) — handles scheduled jobs (slot generation, reminders, expired hold cleanup) and logic not suited to Next.js API routes
Authentication: JWT for reviewers/admins (separate reviewers and admins tables — role implied by table, no shared user_role enum needed); OTP-to-email via Redis for advisors

Server folder structure: organized by module/domain (modules/booking/, modules/feedback/, modules/otp/, etc.) rather than by technical layer — each module bundles its own controller, service, routes, schema, types, and DB/Redis access together.

10. Planned Feature Roadmap

Phase 1 — Core features (MVP)

Availability Templates (multiple time blocks, named templates, timezone-aware)
Event Types (booking links) with fixed durations
Booking flow with overlap prevention
Feedback forms (default + customization)
Check My Bookings (Redis-backed OTP)
Question Banks
Intern Review History

Phase 2 — Admin/Ops visibility

Analytics dashboard
Export (CSV/PDF)
Audit log with search/filter

Phase 3 — Polish

Dark mode
Mobile-responsive booking page
11. Authentication Notes
reviewers and admins are separate tables — role is implied by which table a user belongs to, so no shared users table or user_role enum is required
Each table has email (unique), password_hash, is_active — sufficient for standard JWT login
OTP flow lives entirely in Redis — used only for advisor "Check My Bookings"; reviewers/admins never need OTP since they authenticate via normal login
No otp_codes Postgres table — removed in favor of Redis TTL keys
Optional future additions (not required for MVP): refresh token rotation table, failed-login lockout columns, email verification flag, password reset tokens table
12. Removed / Out of Scope
❌ Tech Stacks / stack tagging (reviewers no longer categorized by tech stack; advisors don't filter by stack)
❌ In-platform messaging (reviewer ↔ advisor)
❌ Multi-language support
❌ SMS reminders
❌ Super Admin–owned public link (link ownership moved to reviewers via Event Types)
❌ OTP storage in Postgres (moved to Redis)
13. PostgreSQL Data Model

16 tables:
admins, reviewers, availability_templates, template_time_blocks, event_types, vacation_blocks, slots, bookings, feedback_forms, feedback_form_fields, feedback, question_banks, questions, audit_logs, settings

Key points reflected in the schema:

No user_role enum (roles implied by table)
No stacks / reviewer_stacks tables
No otp_codes table — OTP lives in Redis
event_types links to availability_templates (one template can serve multiple event types)
slots unique per (event_type_id, slot_date, start_time)
bookings.slot_id is unique — one booking per slot
feedback.custom_field_values stored as JSONB for flexible custom form fields
template_time_blocks supports multiple time ranges per day (Cal.com-style availability UI)

(Full DDL maintained separately in docs/DATABASE-SCHEMA.md / server/src/db/migrations/)

14. Redis Design (OTP)

Key structure:

otp:check_bookings:{email} → { code, attempts }
TTL: 600 seconds (10 min, configurable via otp_expiry_minutes setting)
One-time use — key deleted immediately on successful verification
Attempt counter stored alongside code for lightweight brute-force protection
No cron cleanup needed — Redis TTL handles expiry automatically
15. Summary of Key Features

✅ Reviewer-owned booking links with independent event types
✅ Flexible, named, timezone-aware availability templates (multiple blocks/day)
✅ Atomic slot booking with conflict prevention across all event types
✅ Customizable feedback forms with default + custom fields
✅ Question banks for reviewer reference
✅ Intern review history with continuity suggestions
✅ Redis-backed OTP for advisor self-service (Check My Bookings)
✅ Branded transactional email via Resend + React Email
✅ Full audit trail
✅ Super Admin oversight, analytics, and exports
✅ Next.js full-stack architecture with modular server-side business logic
✅ No stacks/tags, no messaging, no multi-language — lean, focused MVP scope