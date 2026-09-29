import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export interface MeetingBookingRecord {
  id: number;
  reviewerId: number;
  internName: string;
  advisorName: string;
  advisorEmail: string;
  internEmails: string[] | null;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show" | "reschedule_requested" | null;
  eventTypeName: string;
  reviewerName: string;
}

export const findMeetingBookingByIdRepo = async (
  bookingId: number,
  tx: DbOrTx = db
): Promise<MeetingBookingRecord | undefined> => {
  const [booking] = await tx
    .select({
      id: bookings.id,
      reviewerId: bookings.reviewerId,
      internName: bookings.internName,
      advisorName: bookings.advisorName,
      advisorEmail: bookings.advisorEmail,
      internEmails: bookings.internEmails,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      eventTypeName: eventTypes.name,
      reviewerName: reviewers.name,
    })
    .from(bookings)
    .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
    .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking;
};

export const meetingRepository = {
  findMeetingBookingById: findMeetingBookingByIdRepo,
};
