import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

const FEATURES = [
  {
    title: "Availability Templates",
    desc: "Set named, timezone-aware templates with multiple time blocks per day — reuse them across every booking link.",
  },
  {
    title: "Event Types",
    desc: "Create independent booking links with fixed durations. Each one gets its own shareable URL, all guarded against overlap.",
  },
  {
    title: "Question Banks",
    desc: "Build reusable question sets by topic — React, SQL, System Design — and reference them while reviewing.",
  },
  {
    title: "Custom Feedback Forms",
    desc: "Start from the default marks-and-remarks form, or build your own with custom fields per review type.",
  },
  {
    title: "Intern Review History",
    desc: "Automatically surfaces past reviews when the same intern books again — full timeline, marks, and remarks.",
  },
  {
    title: "Admin Oversight",
    desc: "Analytics on bookings, no-shows, and turnaround time, plus a full searchable audit log — all read-only, all transparent.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Set your availability",
    desc: "Build a template once — days, time blocks, timezone — and reuse it across as many booking links as you need.",
  },
  {
    step: "02",
    title: "Share your booking link",
    desc: "Send your reviewslot.com/you/event-name link to an advisor. No account, no back-and-forth — they just pick a slot.",
  },
  {
    step: "03",
    title: "Review and submit feedback",
    desc: "Get a Meet link before the session, review the intern, and submit marks through a form built for exactly this.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <Navbar />

      {/* Hero */}
      <section className="container-page py-24 text-center">
        <span className="mb-6 inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          Built for academic project review coordination
        </span>
        <h1 className="mx-auto mb-6 max-w-3xl text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-on-surface md:text-[52px]">
          Academic reviews,
          <br />
          without the WhatsApp chaos.
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-600">
          RevSlot replaces manual back-and-forth between reviewers and
          advisors with booking links, automated scheduling, and structured
          feedback — no student login, no account for advisors, no
          spreadsheets.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-surface transition-shadow hover:shadow-raised sm:w-auto"
          >
            Get Started as a Reviewer →
          </Link>
          <Link
            href="/login/reviewer"
            className="w-full rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-primary sm:w-auto"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* Problem / solution */}
      <section className="border-y border-slate-100 bg-surface-container-lowest">
        <div className="container-page grid gap-10 py-20 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-600">
              The old way
            </h3>
            <p className="text-xl leading-relaxed text-on-surface">
              An advisor picks a reviewer manually, shares a Google Meet link
              over WhatsApp, and waits for marks and feedback to come back
              the same way — untracked, unstructured, easy to lose.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">
              With RevSlot
            </h3>
            <p className="text-xl leading-relaxed text-on-surface">
              Reviewers publish their own availability and booking links.
              Advisors book directly, no account needed. Meet links,
              reminders, and feedback all flow through one system — timestamped
              and searchable.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-page py-24">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight text-on-surface md:text-4xl">
            Everything a reviewer needs
          </h2>
          <p className="mx-auto max-w-lg text-slate-600">
            Purpose-built tools for the reviewer side of academic project
            coordination — not a generic calendar app stretched to fit.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl bg-surface-card p-6 shadow-surface"
            >
              <h3 className="mb-2 text-base font-semibold text-on-surface">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-primary py-24 text-on-primary">
        <div className="container-page">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Set up once, book forever
            </h2>
            <p className="mx-auto max-w-lg text-secondary/80">
              Three steps between you and a fully automated review pipeline.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span className="mb-4 block text-sm font-semibold text-secondary/70">
                  {s.step}
                </span>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-secondary/80">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-24 text-center">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-on-surface md:text-4xl">
          Stop coordinating reviews over chat.
        </h2>
        <p className="mx-auto mb-8 max-w-md text-slate-600">
          Set your availability, get your link, and let advisors book
          themselves in.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-on-primary shadow-surface transition-shadow hover:shadow-raised"
        >
          Create your reviewer account →
        </Link>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}