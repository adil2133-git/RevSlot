import dayjs from "dayjs";
import { db } from "../../config/db.js";

import { emailService } from "../../services/email.service.js";
import { bookingCancelledTemplate, bookingCancelledTemplateData } from "../../emails/templates/bookingCancelled.js";
import { notificationService } from "../notification/notification.service.js";

import { AppError } from "../../core/errors/AppError.js";

import type { CreateVacationBlockInput, UpdateVacationBlockInput } from "./vacation.validation.js";
import {
  findOwnedVacationBlockRepo,
  checkOverlappingVacationRepo,
  findAffectedBookingsRepo,
  cancelBookingsRepo,
  insertVacationBlockRepo,
  listVacationBlocksByReviewerRepo,
  updateVacationBlockRepo,
  deleteVacationBlockRepo,
} from "./vacation.repository.js";

// Fetches a vacation block only if it belongs to the given reviewer, else throws 404
const getOwnedVacationBlockOrThrow = async (reviewerId: number, blockId: number) => {
  const block = await findOwnedVacationBlockRepo(reviewerId, blockId);

  if (!block) {
    throw new AppError("Vacation block not found", 404);
  }

  return block;
};

const sendVacationCancellationEmails = async (
  affectedBookings: Array<{
    internName: string;
    internEmails: string[] | null;
    advisorEmail: string;
    advisorName: string;
    startTime: Date;
    endTime: Date;
    eventTypeName: string;
    reviewerName: string;
  }>,
  reason: string
) => {
  await Promise.all(
    affectedBookings.flatMap((booking) => {
      const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");

      const formattedTime =
        `${dayjs(booking.startTime).format("h:mm A")} – ` +
        `${dayjs(booking.endTime).format("h:mm A")}`;

      const recipients: {
        email: string;
        name: string;
        role: "advisor" | "intern";
      }[] = [
        {
          email: booking.advisorEmail,
          name: booking.advisorName,
          role: "advisor",
        },
        ...(booking.internEmails ?? []).map((email) => ({
          email,
          name: booking.internName,
          role: "intern" as const,
        })),
      ];

      return recipients.map(({ email, name, role }) => {
        const { html: fallbackHtml } = bookingCancelledTemplate({
          recipientName: name,
          recipientRole: role,
          eventTypeName: booking.eventTypeName,
          reviewerName: booking.reviewerName,
          advisorName: booking.advisorName,
          formattedDate,
          formattedTime,
          reason,
        });
        const { templateId, subject, variables } = bookingCancelledTemplateData({
          recipientName: name,
          recipientRole: role,
          eventTypeName: booking.eventTypeName,
          reviewerName: booking.reviewerName,
          advisorName: booking.advisorName,
          formattedDate,
          formattedTime,
          reason,
        });

        return emailService
          .sendTemplateEmail({
            to: email,
            templateId,
            subject,
            variables,
            fallbackHtml,
          })
          .catch((err) => {
            console.error(
              `[Vacation] Failed to send cancellation email to ${email}:`,
              err
            );
          });
      });
    })
  );
};

export const vacationService = {
  // Creates a new vacation block, warning about (or cancelling) affected bookings
  createVacationBlock: async (reviewerId: number, data: CreateVacationBlockInput) => {
    if (data.startDate < dayjs().format("YYYY-MM-DD")) {
      throw new AppError("Vacation block cannot start in the past", 400);
    }

    const overlapping = await checkOverlappingVacationRepo(reviewerId, data.startDate, data.endDate);
    if (overlapping) {
      throw new AppError("This date range overlaps an existing vacation block", 409);
    }

    const affectedBookings = await findAffectedBookingsRepo(reviewerId, data.startDate, data.endDate);

    if (affectedBookings.length > 0 && !data.confirmCancellations) {
      throw new AppError(
        `This vacation block will affect ${affectedBookings.length} booking(s)`,
        409,
        { affectedBookings }
      );
    }

    const cancellationReason = data.reason
      ? `vacation: ${data.reason}`
      : "vacation";

    const result = await db.transaction(async (tx) => {
      const block = await insertVacationBlockRepo(
        {
          reviewerId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
        },
        tx
      );

      if (!block) {
        throw new AppError("Failed to create vacation block", 500);
      }

      if (affectedBookings.length > 0) {
        await cancelBookingsRepo(
          affectedBookings.map((booking) => booking.id),
          cancellationReason,
          tx
        );
      }

      return {
        ...block,
        cancelledBookingsCount: affectedBookings.length,
      };
    });

    if (affectedBookings.length > 0) {
      await sendVacationCancellationEmails(
        affectedBookings,
        cancellationReason
      );

      for (const booking of affectedBookings) {
        notificationService.createNotification({
          reviewerId,
          type: "booking_cancelled",
          title: "Booking cancelled (Vacation)",
          message: `Session with ${booking.advisorName} on ${dayjs(booking.startTime).format("ddd, MMM D")} was cancelled due to vacation`,
          bookingId: booking.id,
        }).catch((err) => console.error("[Vacation] Notification error:", err));
      }
    }

    return result;
  },

  // Lists all vacation blocks for a reviewer
  listVacationBlocks: async (reviewerId: number) => {
    return await listVacationBlocksByReviewerRepo(reviewerId);
  },

  // Gets a single vacation block owned by the reviewer
  getVacationBlockById: async (reviewerId: number, blockId: number) => {
    return getOwnedVacationBlockOrThrow(reviewerId, blockId);
  },

  // Updates a vacation block's dates/reason, re-running the same overlap + cancellation checks
  updateVacationBlock: async (
    reviewerId: number,
    blockId: number,
    data: UpdateVacationBlockInput
  ) => {
    const existing = await getOwnedVacationBlockOrThrow(reviewerId, blockId);

    const newStartDate = data.startDate ?? existing.startDate;
    const newEndDate = data.endDate ?? existing.endDate;

    if (newStartDate < dayjs().format("YYYY-MM-DD")) {
      throw new AppError("Vacation block cannot start in the past", 400);
    }

    const overlapping = await checkOverlappingVacationRepo(reviewerId, newStartDate, newEndDate, blockId);
    if (overlapping) {
      throw new AppError("This date range overlaps an existing vacation block", 409);
    }

    // Only newly-covered bookings need the warning/cancel flow — bookings
    // already inside the old range were already cancelled when this block
    // was first created.
    const affectedBookings = await findAffectedBookingsRepo(reviewerId, newStartDate, newEndDate);
    const newlyAffected = affectedBookings.filter((b) => {
      const bookingDate = dayjs(b.startTime).format("YYYY-MM-DD");
      return bookingDate < existing.startDate || bookingDate > existing.endDate;
    });

    if (newlyAffected.length > 0 && !data.confirmCancellations) {
      throw new AppError(
        `This change will affect ${newlyAffected.length} additional booking(s)`,
        409,
        { affectedBookings: newlyAffected }
      );
    }

    const effectiveReason = data.reason ?? existing.reason;

    const cancellationReason = effectiveReason
      ? `vacation: ${effectiveReason}`
      : "vacation";

    const result = await db.transaction(async (tx) => {
      const updated = await updateVacationBlockRepo(
        blockId,
        {
          startDate: newStartDate,
          endDate: newEndDate,
          reason: effectiveReason,
        },
        tx
      );

      if (!updated) {
        throw new AppError("Vacation block not found", 404);
      }

      if (newlyAffected.length > 0) {
        await cancelBookingsRepo(
          newlyAffected.map((booking) => booking.id),
          cancellationReason,
          tx
        );
      }

      return {
        ...updated,
        cancelledBookingsCount: newlyAffected.length,
      };
    });

    if (newlyAffected.length > 0) {
      await sendVacationCancellationEmails(
        newlyAffected,
        cancellationReason
      );
    }

    return result;
  },

  // Deletes a vacation block (does not un-cancel any bookings already cancelled by it)
  deleteVacationBlock: async (reviewerId: number, blockId: number) => {
    await getOwnedVacationBlockOrThrow(reviewerId, blockId);

    await deleteVacationBlockRepo(blockId);

    return { id: blockId };
  },
};