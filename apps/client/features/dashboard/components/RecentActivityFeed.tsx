"use client";

import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ActivityFeedItem } from "../type";

dayjs.extend(relativeTime);

interface RecentActivityFeedProps {
  activityFeed: ActivityFeedItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activityFeed,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-surface-card p-6 shadow-surface">
      <h3 className="mb-5 text-base font-bold text-on-surface">Recent Activity Feed</h3>

      {activityFeed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-slate-500">No recent activity yet</p>
          <p className="mt-1 text-xs text-slate-400">Activity updates will show here as bookings occur.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activityFeed.map((item) => {
            const timeAgo = dayjs(item.timestamp).fromNow();

            let dotColor = "bg-primary";
            if (item.type === "rescheduled") {
              dotColor = "bg-amber-500";
            } else if (item.type === "cancellation") {
              dotColor = "bg-error";
            }

            return (
              <div key={item.id} className="flex items-start gap-3 text-xs sm:text-sm">
                <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">{item.title}</span>
                  <span className="mt-0.5 text-xs text-slate-400">{timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
