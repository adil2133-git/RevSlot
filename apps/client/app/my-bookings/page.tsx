"use client";

import { useState, useEffect } from "react";
import { getStoredAdvisorEmail, getStoredAdvisorToken } from "@/features/advisor-bookings/services/advisorApi";
import AdvisorOtpModal from "@/features/advisor-bookings/components/AdvisorOtpModal";
import AdvisorBookingsDashboard from "@/features/advisor-bookings/components/AdvisorBookingsDashboard";

export default function MyBookingsPage() {
  const [advisorEmail, setAdvisorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredAdvisorToken();
    const email = getStoredAdvisorEmail();

    if (token && email) {
      setAdvisorEmail(email);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <p className="text-xs font-semibold text-slate-400">Loading portal…</p>
      </div>
    );
  }

  if (!advisorEmail) {
    return <AdvisorOtpModal onSuccess={(email: string) => setAdvisorEmail(email)} />;
  }

  return (
    <AdvisorBookingsDashboard
      advisorEmail={advisorEmail}
      onLogout={() => setAdvisorEmail(null)}
    />
  );
}
