"use client";

import { useEffect, useState } from "react";
import { fetchReviewerProfile } from "../api/bookingApi";
import type { ReviewerProfile } from "../type";

export function useReviewerProfile(username: string | undefined) {
  const [profile, setProfile] = useState<ReviewerProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      setProfileError("This profile link looks invalid.");
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    fetchReviewerProfile(username)
      .then(setProfile)
      .catch((err: Error) => setProfileError(err.message))
      .finally(() => setProfileLoading(false));
  }, [username]);

  return { profile, profileError, profileLoading };
}