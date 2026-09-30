import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.schema.js";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const connectGoogleCalendarRepo = async (
  reviewerId: number,
  refreshToken: string,
  email: string | null,
  tx: DbOrTx = db
) => {
  return tx
    .update(reviewers)
    .set({
      googleCalendarRefreshToken: refreshToken,
      googleCalendarEmail: email,
      googleCalendarConnected: true,
      updatedAt: new Date(),
    })
    .where(eq(reviewers.id, reviewerId));
};

export const disconnectGoogleCalendarRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return tx
    .update(reviewers)
    .set({
      googleCalendarRefreshToken: null,
      googleCalendarEmail: null,
      googleCalendarConnected: false,
      updatedAt: new Date(),
    })
    .where(eq(reviewers.id, reviewerId));
};

export const getGoogleCalendarStatusRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({
      googleCalendarConnected: reviewers.googleCalendarConnected,
      googleCalendarEmail: reviewers.googleCalendarEmail,
    })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  return reviewer ?? null;
};

export const getReviewerGoogleCalendarAuthRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({
      refreshToken: reviewers.googleCalendarRefreshToken,
      connected: reviewers.googleCalendarConnected,
    })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  return reviewer ?? null;
};

export const calendarRepository = {
  connectGoogleCalendar: connectGoogleCalendarRepo,
  disconnectGoogleCalendar: disconnectGoogleCalendarRepo,
  getGoogleCalendarStatus: getGoogleCalendarStatusRepo,
  getReviewerGoogleCalendarAuth: getReviewerGoogleCalendarAuthRepo,
};
