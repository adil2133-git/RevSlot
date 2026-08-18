"use client";

import { useEffect, useState } from "react";
import { fetchBookingPageInfo } from "../api/bookingApi";
import type { BookingPageInfo } from "../type";

export function useBookingPageInfo(
  reviewerId: number,
  eventSlug: string | undefined
) {
  const [pageInfo, setPageInfo] = useState<BookingPageInfo | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // reviewerId/eventSlug can be invalid (e.g. NaN from a malformed URL) —
    // bail out with a clear error instead of hanging on "Loading..." forever
    if (!reviewerId || Number.isNaN(reviewerId) || !eventSlug) {
      setPageError("This booking link looks invalid.");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    fetchBookingPageInfo(reviewerId, eventSlug)
      .then(setPageInfo)
      .catch((err: Error) => setPageError(err.message))
      .finally(() => setPageLoading(false));
  }, [reviewerId, eventSlug]);

  return { pageInfo, pageError, pageLoading };
}