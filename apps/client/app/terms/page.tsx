import React from "react";
import Link from "next/link";
import NavbarLanding from "@/components/landing/NavbarLanding";
import FooterLanding from "@/components/landing/FooterLanding";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms of Service — RevSlot",
  description: "Terms and conditions governing the use of RevSlot evaluation scheduling platform.",
};

export default function TermsPage() {
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
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using RevSlot (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Services</h2>
            <p>
              RevSlot provides scheduling, availability management, automated calendar integrations, and video conferencing
              rooms for academic, project, and professional reviews between reviewers and candidates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Responsibilities & Conduct</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You agree to provide accurate and complete registration and scheduling details.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree not to misuse, disrupt, or attempt unauthorized access to RevSlot services or third-party integrations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Third-Party Integrations</h2>
            <p>
              RevSlot allows integration with third-party services such as Google Calendar. When you enable these
              features, you grant RevSlot permission to create, modify, and delete relevant calendar events on your behalf.
              RevSlot is not responsible for any downtime, outages, or policies imposed by external providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Bookings and Cancellations</h2>
            <p>
              All bookings, rescheduling requests, and cancellations are subject to the reviewer&apos;s configured availability
              and policy rules. Both parties are expected to attend scheduled meetings punctually via the generated meeting links.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to RevSlot for users who violate these Terms
              or engage in unauthorized or abusive behavior.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact Information</h2>
            <p>
              For inquiries regarding these Terms of Service, please reach out to us at{" "}
              <a href="mailto:mail.revslot@gmail.com" className="text-primary underline">
                mail.revslot@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <FooterLanding />
    </div>
  );
}
