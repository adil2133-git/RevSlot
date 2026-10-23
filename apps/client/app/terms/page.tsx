import React from "react";
import Link from "next/link";
import NavbarLanding from "@/components/landing/NavbarLanding";
import FooterLanding from "@/components/landing/FooterLanding";
import { ArrowLeft, FileText, CheckCircle2, CreditCard, RefreshCw, AlertCircle, Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service — RevSlot",
  description: "Terms and conditions governing the use of the RevSlot evaluation scheduling and review platform.",
};

export default function TermsPage() {
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
            <FileText className="w-3.5 h-3.5" />
            Terms & Conditions
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            RevSlot Terms of Service
          </h1>
          <p className="text-sm text-slate-500">
            Effective Date: <span className="font-medium text-slate-700">{lastUpdated}</span>
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs space-y-10 text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using RevSlot (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              you agree to be legally bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms,
              you must refrain from accessing or using our services.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Services</h2>
            <p>
              RevSlot provides an academic, technical, and professional review scheduling platform. We enable expert reviewers
              to define their availability, connect external calendars, host evaluation sessions, provide qualitative evaluation feedback,
              and receive payments. We enable candidates and academic advisors to schedule appointments, join video conference meetings
              (via Google Meet or RevSlot video rooms), and receive transactional session notifications.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Responsibilities & Conduct</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Accurate Information:</strong> Users agree to supply true, accurate, current, and complete details
                during registration, booking, and payment.
              </li>
              <li>
                <strong>Account Confidentiality:</strong> Reviewers are responsible for securing their account credentials
                and all activities conducted under their account.
              </li>
              <li>
                <strong>Punctuality & Decorum:</strong> Reviewers and candidates are expected to attend scheduled sessions
                punctually and maintain professional, respectful academic conduct.
              </li>
              <li>
                <strong>Prohibited Uses:</strong> Users may not misuse the platform for fraud, unauthorized scraping, harassment,
                impersonation, or intellectual property violation.
              </li>
            </ul>
          </section>

          {/* Section 4 - Booking & Automated Reminders */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Appointments, Scheduling & Reminders</h2>
            <p className="mb-3">
              When a booking is confirmed, RevSlot automatically creates calendar entries and issues transactional notices:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>
                <strong>Booking Confirmation:</strong> Confirmation emails containing the meeting link and session timing are
                dispatched to the reviewer, candidate, and advisor.
              </li>
              <li>
                <strong>Calendar Sync:</strong> If the reviewer has connected Google Calendar, an event with Google Meet credentials
                is created on their calendar. Attendees receive device calendar notifications.
              </li>
              <li>
                <strong>Automated Session Reminders:</strong> RevSlot sends automated reminder emails approximately one hour before the
                session start time to all confirmed attendees.
              </li>
              <li>
                <strong>Attendance & Grace Period:</strong> A 10-minute grace period applies to all sessions. If a candidate does
                not join within 10 minutes of the scheduled start time, the reviewer may mark the session as a no-show.
              </li>
            </ul>
          </section>

          {/* Section 5 - Payments & Escrow */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-primary font-bold text-lg mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>5. Fees, Payments & Escrow Protection</span>
            </div>
            <p className="mb-4 text-slate-700">
              RevSlot facilitates paid review sessions between reviewers and clients with built-in escrow protection:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 mb-4">
              <li>
                <strong>Pricing & Currency:</strong> Review session fees are established independently by reviewers for each
                event type and are displayed in Indian Rupees (INR) at checkout.
              </li>
              <li>
                <strong>Payment Processing:</strong> All payments are securely processed through our regulated payment gateway partner,
                <strong> Razorpay</strong>. We do not store sensitive payment instrument details.
              </li>
              <li>
                <strong>Escrow Mechanism:</strong> When a paid session is booked, the payment is held in a secure pending escrow balance.
                Earnings are released to the reviewer&apos;s available wallet balance 48 hours following successful session completion,
                ensuring quality assurance and dispute resolution window.
              </li>
              <li>
                <strong>Reviewer Payouts:</strong> Reviewers may request withdrawals of their cleared balance to verified Indian bank accounts
                in accordance with standard banking settlement timelines.
              </li>
            </ul>
          </section>

          {/* Section 6 - Cancellation & Refund Policy */}
          <section className="border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg mb-3">
              <RefreshCw className="w-5 h-5 text-primary" />
              <span>6. Cancellation, Rescheduling & Refund Policy</span>
            </div>
            <p className="mb-4 text-slate-700">
              To ensure fairness to both candidates and expert reviewers who reserve their time, the following cancellation
              and refund terms govern all paid sessions:
            </p>

            <div className="space-y-3 mb-5 text-sm">
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <strong className="text-emerald-900 block mb-1">Reviewer Cancellation or Declined Reschedule:</strong>
                <p className="text-emerald-800">
                  If a reviewer cancels a confirmed session or declines an alternative reschedule request, the client receives
                  an <strong>immediate 100% full refund</strong> with zero cancellation fee.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg">
                <strong className="text-blue-900 block mb-1">Client Cancellation More Than 8 Hours in Advance:</strong>
                <p className="text-blue-800">
                  If the client cancels a booking with 8 or more hours remaining before the scheduled start time, a
                  <strong> 100% full refund</strong> is automatically initiated to the original payment source.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg">
                <strong className="text-amber-900 block mb-1">Client Cancellation Between 3 and 8 Hours in Advance:</strong>
                <p className="text-amber-800">
                  If the client cancels between 3 and 8 hours prior to session start, an <strong>85% partial refund</strong> is issued,
                  and a 15% cancellation fee is retained as compensation for the reviewer&apos;s reserved slot.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-lg">
                <strong className="text-rose-900 block mb-1">Cancellations Under 3 Hours & Rescheduled Sessions:</strong>
                <p className="text-rose-800">
                  Sessions starting in less than 3 hours cannot be cancelled online. Furthermore, bookings that have already been
                  rescheduled by the client are strictly <strong>non-refundable</strong> upon any subsequent cancellation.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              * Approved refunds are credited directly back to the original payment method via Razorpay within 5 to 7 banking
              business days, subject to standard bank processing cycles.
            </p>
          </section>

          {/* Section 7 - Third-Party Integrations */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Third-Party Integrations</h2>
            <p>
              RevSlot interfaces with third-party software including Google Calendar, Google Meet, and Razorpay. When you
              utilize these features, you authorize RevSlot to perform operations on your behalf as authorized. RevSlot is not
              liable for third-party service outages, network interruptions, or policy modifications outside our direct control.
            </p>
          </section>

          {/* Section 8 - Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Intellectual Property & Academic Materials</h2>
            <p>
              Candidates retain full ownership of their academic projects, source code, and presentation materials shared during
              evaluations. Reviewers retain ownership of their proprietary evaluation notes and professional methodology.
              The RevSlot name, brand, logo, and platform interface are the exclusive property of RevSlot.
            </p>
          </section>

          {/* Section 9 - Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, RevSlot and its creators shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform,
              evaluation outcomes, technical dropouts during video sessions, or unauthorized account access.
            </p>
          </section>

          {/* Section 10 - Termination */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Suspension & Termination</h2>
            <p>
              We reserve the right to suspend or permanently terminate access to RevSlot for any user who violates these Terms,
              engages in abusive conduct towards candidates or reviewers, or attempts fraudulent financial activities.
            </p>
          </section>

          {/* Section 11 - Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Governing Law & Contact</h2>
            <p className="mb-3">
              These Terms of Service are governed by and construed in accordance with the laws of India. For questions or support
              regarding these terms, please contact us:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
              <p><strong>RevSlot Legal & Support Team</strong></p>
              <p>Email: <a href="mailto:mail.revslot@gmail.com" className="text-primary underline">mail.revslot@gmail.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <FooterLanding />
    </div>
  );
}
