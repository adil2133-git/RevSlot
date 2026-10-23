import React from "react";
import Link from "next/link";
import NavbarLanding from "@/components/landing/NavbarLanding";
import FooterLanding from "@/components/landing/FooterLanding";
import { ArrowLeft, ShieldCheck, Lock, Calendar, CreditCard, Bell, EyeOff } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — RevSlot",
  description: "Learn how RevSlot collects, uses, and protects your information, including Google Calendar integrations and payment processing.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 24, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-100 selection:text-primary">
      <NavbarLanding />

      <main className="container-page py-12 md:py-16 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Legal & Transparency
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            RevSlot Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">
            Effective Date: <span className="font-medium text-slate-700">{lastUpdated}</span>
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs space-y-10 text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to RevSlot (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). RevSlot is an academic, technical,
              and professional evaluation scheduling platform that connects expert reviewers with students, candidates,
              and academic advisors. We respect your privacy and are committed to protecting the personal information
              entrusted to us. This Privacy Policy explains what information we collect, why we collect it, how it is used,
              and your rights regarding your data.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Account Information (Reviewers & Hosts)
                </h3>
                <p className="text-sm text-slate-600">
                  When a reviewer registers on RevSlot, we collect their full name, email address, password hash,
                  professional profile credentials, bio, and portfolio links.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Attendee & Booking Information (Candidates & Advisors)
                </h3>
                <p className="text-sm text-slate-600">
                  When an advisor or candidate books a review session, we collect the candidate&apos;s full name,
                  advisor email address, candidate/intern email address, WhatsApp contact number, academic batch or stage,
                  and specific review focus areas. This information is collected solely to schedule and execute the session.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Scheduling & Meeting Data
                </h3>
                <p className="text-sm text-slate-600">
                  We collect event duration preferences, booked time slots, session statuses (confirmed, completed, rescheduled,
                  or cancelled), feedback notes, and meeting room links (including Google Meet or RevSlot video rooms).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment & Transaction Data
                </h3>
                <p className="text-sm text-slate-600">
                  For paid sessions, payment processing is handled securely by our payment partner, <strong>Razorpay</strong>.
                  We collect and store transaction metadata including Razorpay order IDs, payment IDs, transaction amounts,
                  and escrow release timestamps. <strong>RevSlot never collects, views, or stores your credit card numbers,
                  CVVs, debit card PINs, or UPI credentials.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 - Google OAuth (Critical for Verification) */}
          <section className="bg-slate-50 border border-blue-100 rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-primary font-bold text-lg mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span>3. Google API Services & Calendar Integration</span>
            </div>
            <p className="mb-4">
              RevSlot allows reviewers to voluntarily connect their Google Calendar to streamline appointment
              management and generate Google Meet conference links. When you authorize RevSlot to access your Google Account,
              we request access strictly to the following scopes:
            </p>
            <div className="space-y-3 mb-5">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm">
                <code className="text-xs font-mono font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                  https://www.googleapis.com/auth/calendar.events
                </code>
                <p className="mt-1 text-slate-600">
                  Used solely to create, update, or cancel calendar events for sessions booked through RevSlot,
                  and to insert session details including the meeting link. Calendar reminders are configured with
                  device popup notifications so attendees stay reminded without receiving redundant plain emails.
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm">
                <code className="text-xs font-mono font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                  https://www.googleapis.com/auth/calendar.freebusy
                </code>
                <p className="mt-1 text-slate-600">
                  Used solely to query busy intervals on your primary calendar so conflicting RevSlot slots are automatically
                  hidden from public booking pages.
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm">
                <code className="text-xs font-mono font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                  userinfo.email & userinfo.profile
                </code>
                <p className="mt-1 text-slate-600">
                  Used to verify your Google identity and display your connected Google account email in the dashboard.
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-slate-900 mb-2">How We Handle Google Calendar Data:</h3>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-slate-600 mb-5">
              <li>
                <strong>Limited Scope of Access:</strong> RevSlot only modifies events that were created by RevSlot.
                We do not read, view, parse, or store the contents or attendees of your personal or unrelated calendar events.
              </li>
              <li>
                <strong>No Third-Party Sharing:</strong> We do not sell, rent, or transfer your Google Calendar data
                or personal information to third parties, advertising platforms, data brokers, or AI model training pipelines.
              </li>
              <li>
                <strong>Secure Credential Storage:</strong> Your Google OAuth tokens are encrypted in transit and at
                rest in our secure database, accessed strictly when executing calendar operations on your behalf.
              </li>
            </ul>

            {/* Google Limited Use Disclosure - REQUIRED WORDING */}
            <div className="bg-blue-50 border-l-4 border-primary p-4 rounded-r-lg">
              <h4 className="font-bold text-primary text-sm uppercase tracking-wide mb-1">
                Google Limited Use Disclosure
              </h4>
              <p className="text-sm text-slate-700">
                RevSlot&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline hover:text-blue-800"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </div>
          </section>

          {/* Section 4 - Transactional Communications */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Transactional Communications & Reminders</h2>
            <p className="mb-3">
              We communicate with reviewers, candidates, and advisors via transactional email and calendar invites for
              essential scheduling coordination:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>
                <strong>Booking Confirmations:</strong> Sent immediately upon successful booking and payment confirmation,
                containing session timing, meeting instructions, and calendar invitations.
              </li>
              <li>
                <strong>Session Reminders:</strong> Sent approximately one hour before the scheduled review to ensure all
                attendees have direct access to the meeting link.
              </li>
              <li>
                <strong>Rescheduling & Cancellation Notices:</strong> Sent whenever a session is rescheduled, cancelled, or
                modified by either party.
              </li>
              <li>
                <strong>No Unsolicited Marketing:</strong> We do not use participant emails or phone numbers for marketing newsletters,
                commercial advertisements, or third-party promotions.
              </li>
            </ul>
          </section>

          {/* Section 5 - Third Party Processors */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Third-Party Service Providers</h2>
            <p className="mb-3">
              We partner with trusted third-party service providers to deliver our core platform functionality:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Razorpay:</strong> Secure payment processing and automated refund fulfillment.</li>
              <li><strong>Google Calendar API:</strong> Availability conflict detection and Google Meet link generation.</li>
              <li><strong>Resend:</strong> Secure delivery of transactional booking notifications and reminder emails.</li>
              <li><strong>Cloudinary:</strong> Secure cloud storage for reviewer avatar images and profile documents.</li>
            </ul>
          </section>

          {/* Section 6 - Revoking Google Calendar Access */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Revoking Google Calendar Access</h2>
            <p className="mb-3">
              Reviewers retain complete control over their connected Google account at all times:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>From RevSlot:</strong> Navigate to Reviewer Dashboard &gt; Availability &gt; Calendar Settings
                and click &quot;Disconnect Google Calendar&quot;. This immediately deletes your stored refresh tokens from our database.
              </li>
              <li>
                <strong>From Google:</strong> You can revoke RevSlot&apos;s access directly at any time via{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline font-medium"
                >
                  Google Account Third-party apps & services
                </a>
                .
              </li>
            </ul>
          </section>

          {/* Section 7 - Data Security */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Data Security & Retention</h2>
            <p>
              We implement industry-standard administrative, technical, and physical security safeguards to protect
              your personal data against unauthorized access, loss, alteration, or disclosure. All network communications
              use TLS/HTTPS encryption. User data is retained only for as long as necessary to provide scheduling and
              compliance services, or until you request account deletion.
            </p>
          </section>

          {/* Section 8 - Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Contact Us</h2>
            <p className="mb-2">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us at:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
              <p><strong>RevSlot Support</strong></p>
              <p>Email: <a href="mailto:mail.revslot@gmail.com" className="text-primary underline">mail.revslot@gmail.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <FooterLanding />
    </div>
  );
}
