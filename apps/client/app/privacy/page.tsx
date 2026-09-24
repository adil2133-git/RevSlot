import React from "react";
import Link from "next/link";
import NavbarLanding from "@/components/landing/NavbarLanding";
import FooterLanding from "@/components/landing/FooterLanding";
import { ArrowLeft, ShieldCheck, Lock, Calendar, EyeOff } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — RevSlot",
  description: "Learn how RevSlot collects, uses, and protects your information, including Google Calendar integrations.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 24, 2026";

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
              and professional evaluation scheduling platform that connects reviewers with candidates.
              We respect your privacy and are committed to protecting the personal information you share with us.
              This Privacy Policy explains what information we collect, how we use it, and your choices regarding your data.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register, we collect your name, email address,
                and basic profile credentials.
              </li>
              <li>
                <strong>Scheduling & Availability Data:</strong> Time slots, session durations, booked reviews,
                and calendar availability configuration.
              </li>
              <li>
                <strong>Meeting & Communication Data:</strong> Booking metadata, attendance status, and customized
                RevSlot video meeting room URLs.
              </li>
            </ul>
          </section>

          {/* Section 3 - Google OAuth (Critical for Verification) */}
          <section className="bg-slate-50 border border-blue-100 rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-primary font-bold text-lg mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span>3. Google API Services & Calendar Integration</span>
            </div>
            <p className="mb-4">
              RevSlot allows reviewers to voluntarily connect their Google Calendar to streamline appointment
              management. When you authorize RevSlot to access your Google Account, we request access to the following scopes:
            </p>
            <div className="space-y-3 mb-5">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm">
                <code className="text-xs font-mono font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                  https://www.googleapis.com/auth/calendar.events
                </code>
                <p className="mt-1 text-slate-600">
                  Used solely to create, update, or cancel calendar events for reviews booked through RevSlot,
                  and to insert your session details including the secure RevSlot meeting link.
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-sm">
                <code className="text-xs font-mono font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded">
                  userinfo.email & userinfo.profile
                </code>
                <p className="mt-1 text-slate-600">
                  Used to verify your Google identity and display your connected Google account email.
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-slate-900 mb-2">How We Handle Google Calendar Data:</h3>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-slate-600 mb-5">
              <li>
                <strong>Limited Scope of Access:</strong> RevSlot only modifies events that were created by RevSlot.
                We do not read, view, parse, or store the contents of your existing personal or unrelated calendar events.
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

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Revoking Google Calendar Access</h2>
            <p className="mb-3">
              You retain full control over your connected Google account at all times:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>From RevSlot:</strong> Navigate to your Reviewer Dashboard &gt; Availability &gt; Calendar Settings
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

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard administrative, technical, and physical security safeguards to protect
              your personal data against unauthorized access, loss, alteration, or disclosure. All network communications
              use TLS/HTTPS encryption.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Us</h2>
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
