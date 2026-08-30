import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.model.js";
import { AppError } from "../../core/errors/AppError.js";
import { signCalendarState, verifyCalendarState } from "../../core/utils/jwt.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_CALENDAR_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI as string;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALENDAR_REDIRECT_URI) {
  throw new Error(
    "Google Calendar env vars are not set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_REDIRECT_URI)"
  );
}

// A fresh client per call — googleapis OAuth2 clients are cheap and this
// avoids any shared-mutable-state footguns across concurrent requests.
const createOAuthClient = () =>
  new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALENDAR_REDIRECT_URI
  );

export const calendarService = {
  // Step 1: reviewer clicks "Connect Google Calendar" in the dashboard.
  // We hand back a Google consent URL scoped to `calendar.events` only
  // (not full calendar access) with access_type=offline + prompt=consent
  // so Google actually issues a refresh_token (it won't on repeat
  // consents otherwise). `state` carries the reviewerId, signed so it
  // can't be tampered with on the redirect back.
    getConnectUrl: (reviewerId: number) => {
    const client = createOAuthClient();
    const state = signCalendarState({ reviewerId });

    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state,
    });
  },

  // Step 2: Google redirects back here with a one-time `code`. Exchange
  // it for tokens and persist the refresh_token — that's the only piece
  // we need long-term, since access_tokens are re-derived from it on
  // every calendar call.
  handleOAuthCallback: async (code: string, state: string) => {
    const { reviewerId } = verifyCalendarState(state);

    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      throw new AppError(
        "Google didn't return a long-lived grant. Please try connecting again.",
        400
      );
    }

    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: client,
      version: "v2",
    });

    const { data: googleProfile } = await oauth2.userinfo.get();

    await db
      .update(reviewers)
      .set({
        googleCalendarRefreshToken: tokens.refresh_token,
        googleCalendarEmail: googleProfile.email ?? null,
        googleCalendarConnected: true,
        updatedAt: new Date(),
      })
      .where(eq(reviewers.id, reviewerId));

    return { reviewerId };
  },

  disconnect: async (reviewerId: number) => {
    await db
      .update(reviewers)
      .set({
        googleCalendarRefreshToken: null,
        googleCalendarEmail: null,
        googleCalendarConnected: false,
        updatedAt: new Date(),
      })
      .where(eq(reviewers.id, reviewerId));
  },

  getStatus: async (reviewerId: number) => {
    const [reviewer] = await db
      .select({
        googleCalendarConnected: reviewers.googleCalendarConnected,
        googleCalendarEmail: reviewers.googleCalendarEmail,
      })
      .from(reviewers)
      .where(eq(reviewers.id, reviewerId))
      .limit(1);

    if (!reviewer) {
      throw new AppError("Reviewer not found", 404);
    }

    return reviewer;
  },

  // Called from booking.service.ts right after a booking is confirmed.
  // Creates a Calendar event on the reviewer's calendar with
  // conferenceData set to auto-generate a Google Meet link.
  createMeetEvent: async (params: {
    reviewerId: number;
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    attendeeEmails: string[];
  }): Promise<{ meetLink: string; googleEventId: string } | null> => {
    const [reviewer] = await db
      .select({
        refreshToken: reviewers.googleCalendarRefreshToken,
        connected: reviewers.googleCalendarConnected,
      })
      .from(reviewers)
      .where(eq(reviewers.id, params.reviewerId))
      .limit(1);

    if (!reviewer?.connected || !reviewer.refreshToken) {
      return null;
    }

    const client = createOAuthClient();

    client.setCredentials({
      refresh_token: reviewer.refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: client,
    });

    try {
      const { data: event } = await calendar.events.insert(
        {
          calendarId: "primary",
          sendUpdates: "all",
          conferenceDataVersion: 1,
          requestBody: {
            summary: params.summary,

            ...(params.description
              ? { description: params.description }
              : {}),

            start: {
              dateTime: params.startTime.toISOString(),
              timeZone: params.timezone,
            },

            end: {
              dateTime: params.endTime.toISOString(),
              timeZone: params.timezone,
            },

            attendees: params.attendeeEmails
              .filter(Boolean)
              .map((email) => ({ email })),

            conferenceData: {
              createRequest: {
                requestId: `revslot-${Date.now()}-${params.reviewerId}`,
                conferenceSolutionKey: {
                  type: "hangoutsMeet",
                },
              },
            },
          },
        },
        {}
      );

      const meetLink = event.hangoutLink;

      if (!meetLink || !event.id) {
        return null;
      }

      return {
        meetLink,
        googleEventId: event.id,
      };
    } catch (err: any) {
      console.error(
        `[Calendar Service] Failed to create Meet event for reviewer ${params.reviewerId}:`,
        err.message || err
      );

      return null;
    }
  },

  // Called from booking.service.ts when a booking is cancelled or
  // rescheduled (before the old event is replaced). Best-effort — if the
  // reviewer isn't connected, or the event was already removed on
  // Google's side, this just no-ops rather than throwing.
  cancelMeetEvent: async (reviewerId: number, googleEventId: string): Promise<void> => {
    const [reviewer] = await db
      .select({
        refreshToken: reviewers.googleCalendarRefreshToken,
        connected: reviewers.googleCalendarConnected,
      })
      .from(reviewers)
      .where(eq(reviewers.id, reviewerId))
      .limit(1);

    if (!reviewer?.connected || !reviewer.refreshToken) {
      return;
    }

    const client = createOAuthClient();
    client.setCredentials({ refresh_token: reviewer.refreshToken });

    const calendar = google.calendar({ version: "v3", auth: client });

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: googleEventId,
        sendUpdates: "all",
      });
    } catch (err: any) {
      console.error(
        `[Calendar Service] Failed to delete event ${googleEventId} for reviewer ${reviewerId}:`,
        err.message || err
      );
    }
  },
};

export { CLIENT_URL };