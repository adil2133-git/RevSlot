import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "../../config/db.js";
import { AppError } from "../../core/errors/AppError.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const MEETING_ROOM_SECRET =
  process.env.MEETING_ROOM_SECRET || process.env.JWT_ACCESS_SECRET;

if (!MEETING_ROOM_SECRET) {
  throw new Error(
    "MEETING_ROOM_SECRET (or JWT_ACCESS_SECRET) is required"
  );
}

const MAX_PARTICIPANTS = 8;

export type MeetingParticipant = {
  id: string;
  name: string;
  lastSeen: number;
};

export type ChatMessage = {
  id: number;
  participantId: string;
  name: string;
  message: string;
  createdAt: number;
};

type MeetingRoom = {
  participants: Map<string, MeetingParticipant>;
  messages: ChatMessage[];
  nextMessageId: number;
};

const rooms = new Map<number, MeetingRoom>();
const meetingAttendance = new Map<
  number,
  {
    reviewerJoined: boolean;
    clientJoined: boolean;
    attendees: { id: string; name: string; joinedAt: Date }[];
  }
>();

const getRoom = (bookingId: number): MeetingRoom => {
  let room = rooms.get(bookingId);

  if (!room) {
    room = {
      participants: new Map(),
      messages: [],
      nextMessageId: 1,
    };

    rooms.set(bookingId, room);
  }

  return room;
};

const signMeetingToken = (bookingId: number) =>
  crypto
    .createHmac("sha256", MEETING_ROOM_SECRET!)
    .update(`booking:${bookingId}`)
    .digest("hex");

const safeEqual = (a: string, b: string) => {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  return (
    aBuffer.length === bBuffer.length &&
    crypto.timingSafeEqual(aBuffer, bBuffer)
  );
};

export const meetingService = {
  getMeetingLink: (bookingId: number) =>
    `${CLIENT_URL.replace(/\/$/, "")}/meeting/${bookingId}?token=${signMeetingToken(bookingId)}`,

  validateAccess: async (bookingId: number, token: string) => {
    if (!safeEqual(token, signMeetingToken(bookingId))) {
      throw new AppError("Invalid meeting link", 403);
    }

    const [booking] = await db
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
      .innerJoin(
        eventTypes,
        eq(bookings.eventTypeId, eventTypes.id)
      )
      .innerJoin(
        reviewers,
        eq(bookings.reviewerId, reviewers.id)
      )
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError("Meeting not found", 404);
    }

    if (
      booking.status !== "confirmed" &&
      booking.status !== "rescheduled"
    ) {
      throw new AppError("This meeting is not active", 409);
    }

    const JOIN_WINDOW_MS = 15 * 60 * 1000;
    const earliestJoinTime = new Date(booking.startTime).getTime() - JOIN_WINDOW_MS;
    if (Date.now() < earliestJoinTime) {
      throw new AppError("The meeting room opens 15 minutes before the scheduled start time", 403);
    }

    if (Date.now() >= new Date(booking.endTime).getTime()) {
      throw new AppError("The meeting has ended", 403);
    }

    return booking;
  },

  join: async (
    bookingId: number,
    token: string,
    participant: Omit<MeetingParticipant, "lastSeen">
  ) => {
    const booking = await meetingService.validateAccess(
      bookingId,
      token
    );

    const room = getRoom(bookingId);

    if (
      !room.participants.has(participant.id) &&
      room.participants.size >= MAX_PARTICIPANTS
    ) {
      throw new AppError(
        `This meeting supports up to ${MAX_PARTICIPANTS} participants`,
        409
      );
    }

    room.participants.set(participant.id, {
      ...participant,
      lastSeen: Date.now(),
    });

    let attendance = meetingAttendance.get(bookingId);
    if (!attendance) {
      attendance = { reviewerJoined: false, clientJoined: false, attendees: [] };
      meetingAttendance.set(bookingId, attendance);
    }
    const isReviewer = participant.name.toLowerCase().includes(booking.reviewerName.toLowerCase());
    if (isReviewer) {
      attendance.reviewerJoined = true;
    } else {
      attendance.clientJoined = true;
    }
    attendance.attendees.push({ id: participant.id, name: participant.name, joinedAt: new Date() });

    return {
      booking,
      participants: [...room.participants.values()],
      messages: room.messages.slice(-100),
      maxParticipants: MAX_PARTICIPANTS,
    };
  },

  heartbeat: async (
    bookingId: number,
    token: string,
    participantId: string
  ) => {
    await meetingService.validateAccess(bookingId, token);

    const room = rooms.get(bookingId);
    const participant = room?.participants.get(participantId);

    if (!participant) {
      throw new AppError(
        "Participant is not in this meeting",
        404
      );
    }

    participant.lastSeen = Date.now();
  },

  leave: async (
    bookingId: number,
    token: string,
    participantId: string
  ) => {
    if (!safeEqual(token, signMeetingToken(bookingId))) {
      throw new AppError("Invalid meeting link", 403);
    }

    const room = rooms.get(bookingId);

    if (!room) return;

    room.participants.delete(participantId);

    if (room.participants.size === 0) {
      rooms.delete(bookingId);
    }
  },

  validateParticipantPair: async (
    bookingId: number,
    token: string,
    from: string,
    to: string
  ) => {
    await meetingService.validateAccess(bookingId, token);

    const room = rooms.get(bookingId);

    if (
      !room?.participants.has(from) ||
      !room.participants.has(to)
    ) {
      throw new AppError(
        "Both participants must be in the meeting",
        403
      );
    }
  },

  addMessage: async (
    bookingId: number,
    token: string,
    participantId: string,
    message: string
  ) => {
    await meetingService.validateAccess(bookingId, token);

    const room = getRoom(bookingId);
    const participant = room.participants.get(participantId);

    if (!participant) {
      throw new AppError(
        "Participant is not in this meeting",
        403
      );
    }

    const cleanMessage = message.trim().slice(0, 2000);

    if (!cleanMessage) {
      throw new AppError("Message cannot be empty", 400);
    }

    const item: ChatMessage = {
      id: room.nextMessageId++,
      participantId,
      name: participant.name,
      message: cleanMessage,
      createdAt: Date.now(),
    };

    room.messages.push(item);

    if (room.messages.length > 200) {
      room.messages.splice(0, room.messages.length - 200);
    }

    return item;
  },

  getAttendance: (bookingId: number) => {
    return meetingAttendance.get(bookingId) || { reviewerJoined: false, clientJoined: false, attendees: [] };
  },
};
