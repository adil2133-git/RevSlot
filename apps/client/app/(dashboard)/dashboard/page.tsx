"use client";

import React, { useEffect, useState, Suspense } from "react";
import { fetchDashboardSummary } from "@/features/dashboard/api/dashboardApi";
import type { DashboardSummaryData } from "@/features/dashboard/type";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MetricsCards } from "@/features/dashboard/components/MetricsCards";
import { AlertsStack } from "@/features/dashboard/components/AlertsStack";
import { TodaysSchedule } from "@/features/dashboard/components/TodaysSchedule";
import { ReferenceQuestionsDrawer } from "@/features/dashboard/components/ReferenceQuestionsDrawer";
import { RecentActivityFeed } from "@/features/dashboard/components/RecentActivityFeed";
import { QuickShareWidget } from "@/features/dashboard/components/QuickShareWidget";
import { AvailabilityWidget } from "@/features/dashboard/components/AvailabilityWidget";
import GoogleCalendarCard from "@/features/calendar/components/GoogleCalendarCard";

export default function ReviewerDashboardPage() {
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("today");
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reference Questions side drawer state
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchDashboardSummary(timeframe)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Dashboard data fetch error:", err);
        if (isMounted) {
          setError("Failed to load dashboard data. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  const handleOpenReferenceDrawer = (bookingId: number) => {
    setActiveBookingId(bookingId);
    setDrawerOpen(true);
  };

  const scheduleList = data?.todaysSchedule || [];
  const todaySessionCount = scheduleList.length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Welcome */}
      <DashboardHeader reviewer={data?.reviewer} todayCount={todaySessionCount} />

      {/* 2. Google Calendar Integration Card */}
      <Suspense fallback={null}>
        <GoogleCalendarCard />
      </Suspense>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200/80 bg-surface-card" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl border border-slate-200/80 bg-surface-card" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Real Dashboard Content */}
      {!loading && data && (
        <>
          {/* 3. Metrics 4 Cards */}
          <MetricsCards
            metrics={data.metrics}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
          />

          {/* 4. Alerts Stack */}
          {data.alerts && <AlertsStack alerts={data.alerts} />}

          {/* 5. Today's Schedule */}
          <TodaysSchedule
            schedule={scheduleList}
            onOpenReferenceDrawer={handleOpenReferenceDrawer}
          />

          {/* 6. Bottom Row: Activity Feed & Quick Widgets */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (2/3 width on lg): Activity Feed */}
            <div className="lg:col-span-2">
              <RecentActivityFeed activityFeed={data.activityFeed || []} />
            </div>

            {/* Right Column (1/3 width on lg): Quick Share & Availability Overview */}
            <div className="flex flex-col gap-6">
              <QuickShareWidget
                eventTypes={data.quickShareEventTypes || []}
                username={data.reviewer?.username}
              />
              <AvailabilityWidget availability={data.availabilityOverview} />
            </div>
          </div>
        </>
      )}

      {/* Reference Questions Side Drawer Sheet */}
      <ReferenceQuestionsDrawer
        isOpen={drawerOpen}
        bookingId={activeBookingId}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
