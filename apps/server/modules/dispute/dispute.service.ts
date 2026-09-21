import { eq, and, desc, sql } from "drizzle-orm";
import dayjs from "dayjs";
import { db } from "../../config/db.js";
import { bookingDisputes } from "./disputes.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { payments } from "../payment/payments.schema.js";
import { walletTransactions, reviewerWallets } from "../wallet/wallet.schema.js";
import { meetingService } from "../meeting/meeting.service.js";
import { refundService } from "../payment/refund.service.js";
import { emailService } from "../../services/email.service.js";
import { disputeReportedTemplate, disputeReportedTemplateData } from "../../emails/templates/disputeReported.js";
import { disputeResolvedTemplate, disputeResolvedTemplateData } from "../../emails/templates/disputeResolved.js";
import { notificationService } from "../notification/notification.service.js";
import { admins } from "../admin/admins.schema.js";
import { auditLogService } from "../auditLog/auditLog.service.js";
import { AppError } from "../../core/errors/AppError.js";

export interface ReportDisputeInput {
  reason: "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other";
  description: string;
}

export const disputeService = {
  reportDispute: async (
    bookingId: number,
    advisorEmail: string,
    data: ReportDisputeInput
  ) => {
    const [booking] = await db
      .select({
        id: bookings.id,
        advisorName: bookings.advisorName,
        advisorEmail: bookings.advisorEmail,
        reviewerId: bookings.reviewerId,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        eventTypeName: eventTypes.name,
      })
      .from(bookings)
      .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.advisorEmail.toLowerCase() !== advisorEmail.toLowerCase()) {
      throw new AppError("You are not authorized to report an issue for this session", 403);
    }

    // Must have started
    if (dayjs().isBefore(dayjs(booking.startTime))) {
      throw new AppError("You can only report an issue after the session scheduled start time", 400);
    }

    // Must be within 48 hours of session end
    const hoursSinceEnd = dayjs().diff(dayjs(booking.endTime), "hour", true);
    if (hoursSinceEnd > 48) {
      throw new AppError("Disputes must be submitted within 48 hours of the session completion", 400);
    }

    // Check existing
    const [existing] = await db
      .select()
      .from(bookingDisputes)
      .where(eq(bookingDisputes.bookingId, bookingId))
      .limit(1);

    if (existing) {
      throw new AppError("A dispute is already registered for this booking", 409);
    }

    // Attendance verification signals from meeting room
    const attendance = meetingService.getAttendance(bookingId);

    const [dispute] = await db
      .insert(bookingDisputes)
      .values({
        bookingId,
        advisorEmail,
        reason: data.reason,
        description: data.description,
        status: "under_review",
        meetingJoinedByReviewer: attendance.reviewerJoined,
        meetingJoinedByClient: attendance.clientJoined,
      })
      .returning();

    // FREEZE ESCROW: Mark escrow transaction as 'disputed' so it cannot auto-mature
    await db
      .update(walletTransactions)
      .set({ status: "disputed" })
      .where(
        and(
          eq(walletTransactions.bookingId, bookingId),
          eq(walletTransactions.type, "credit_escrow")
        )
      );

    // 1. In-app notification to Reviewer (Socket.IO live alert)
    await notificationService.createNotification({
      reviewerId: booking.reviewerId,
      type: "dispute_filed",
      title: "Issue reported on session",
      message: `${booking.advisorName} reported an issue on Booking #${bookingId} (${data.reason.replace(/_/g, " ")})`,
      bookingId,
    });

    // 2. In-app notification to Admins (Socket.IO live alert)
    await notificationService.createAdminNotification({
      type: "admin_new_dispute",
      title: `New dispute: Booking #${bookingId}`,
      message: `${booking.advisorName} filed a dispute for ${booking.eventTypeName} with ${booking.reviewerName}`,
      bookingId,
    });

    // 3. Email notifications
    // Advisor confirmation email
    const advisorMail = disputeReportedTemplate({
      recipientName: booking.advisorName,
      recipientRole: "advisor",
      bookingId,
      eventTypeName: booking.eventTypeName,
      reason: data.reason,
      description: data.description,
      reviewerName: booking.reviewerName,
      advisorName: booking.advisorName,
      advisorEmail: booking.advisorEmail,
    });
    const advisorMailData = disputeReportedTemplateData({
      recipientName: booking.advisorName,
      recipientRole: "advisor",
      bookingId,
      eventTypeName: booking.eventTypeName,
      reason: data.reason,
      description: data.description,
      reviewerName: booking.reviewerName,
      advisorName: booking.advisorName,
      advisorEmail: booking.advisorEmail,
    });
    emailService.sendTemplateEmail({ to: booking.advisorEmail, templateId: advisorMailData.templateId, subject: advisorMailData.subject, variables: advisorMailData.variables, fallbackHtml: advisorMail.html }).catch((err) => {
      console.error("[Dispute] Failed to send advisor dispute email:", err);
    });

    // Reviewer alert email
    const reviewerMail = disputeReportedTemplate({
      recipientName: booking.reviewerName,
      recipientRole: "reviewer",
      bookingId,
      eventTypeName: booking.eventTypeName,
      reason: data.reason,
      description: data.description,
      reviewerName: booking.reviewerName,
      advisorName: booking.advisorName,
      advisorEmail: booking.advisorEmail,
    });
    const reviewerMailData = disputeReportedTemplateData({
      recipientName: booking.reviewerName,
      recipientRole: "reviewer",
      bookingId,
      eventTypeName: booking.eventTypeName,
      reason: data.reason,
      description: data.description,
      reviewerName: booking.reviewerName,
      advisorName: booking.advisorName,
      advisorEmail: booking.advisorEmail,
    });
    emailService.sendTemplateEmail({ to: booking.reviewerEmail, templateId: reviewerMailData.templateId, subject: reviewerMailData.subject, variables: reviewerMailData.variables, fallbackHtml: reviewerMail.html }).catch((err) => {
      console.error("[Dispute] Failed to send reviewer dispute email:", err);
    });

    // Admin alert email to active admins
    db.select({ email: admins.email, name: admins.name })
      .from(admins)
      .where(eq(admins.isActive, true))
      .then((activeAdmins) => {
        for (const adm of activeAdmins) {
          const adminMail = disputeReportedTemplate({
            recipientName: adm.name,
            recipientRole: "admin",
            bookingId,
            eventTypeName: booking.eventTypeName,
            reason: data.reason,
            description: data.description,
            reviewerName: booking.reviewerName,
            advisorName: booking.advisorName,
            advisorEmail: booking.advisorEmail,
          });
          const adminMailData = disputeReportedTemplateData({
            recipientName: adm.name,
            recipientRole: "admin",
            bookingId,
            eventTypeName: booking.eventTypeName,
            reason: data.reason,
            description: data.description,
            reviewerName: booking.reviewerName,
            advisorName: booking.advisorName,
            advisorEmail: booking.advisorEmail,
          });
          emailService.sendTemplateEmail({ to: adm.email, templateId: adminMailData.templateId, subject: adminMailData.subject, variables: adminMailData.variables, fallbackHtml: adminMail.html }).catch((err) => {
            console.error(`[Dispute] Failed to send admin email to ${adm.email}:`, err);
          });
        }
      })
      .catch((err) => console.error("[Dispute] Failed to fetch admins for email alert:", err));

    return dispute;
  },

  getDisputeForBooking: async (
    bookingId: number,
    filter: { advisorEmail?: string | undefined; reviewerId?: number | undefined }
  ) => {
    if (filter.advisorEmail) {
      const [dispute] = await db
        .select()
        .from(bookingDisputes)
        .where(
          and(
            eq(bookingDisputes.bookingId, bookingId),
            eq(bookingDisputes.advisorEmail, filter.advisorEmail.trim().toLowerCase())
          )
        )
        .limit(1);

      return dispute || null;
    }

    if (filter.reviewerId) {
      const [dispute] = await db
        .select({
          id: bookingDisputes.id,
          bookingId: bookingDisputes.bookingId,
          advisorEmail: bookingDisputes.advisorEmail,
          reason: bookingDisputes.reason,
          description: bookingDisputes.description,
          status: bookingDisputes.status,
          meetingJoinedByReviewer: bookingDisputes.meetingJoinedByReviewer,
          meetingJoinedByClient: bookingDisputes.meetingJoinedByClient,
          adminNotes: bookingDisputes.adminNotes,
          resolvedAt: bookingDisputes.resolvedAt,
          resolvedBy: bookingDisputes.resolvedBy,
          createdAt: bookingDisputes.createdAt,
        })
        .from(bookingDisputes)
        .innerJoin(bookings, eq(bookings.id, bookingDisputes.bookingId))
        .where(
          and(
            eq(bookingDisputes.bookingId, bookingId),
            eq(bookings.reviewerId, filter.reviewerId)
          )
        )
        .limit(1);

      return dispute || null;
    }

    return null;
  },

  listAdminDisputes: async (params: {
    status?: "under_review" | "resolved_refunded" | "resolved_dismissed";
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 5;
    const offset = (page - 1) * limit;

    const baseQuery = db
      .select({
        id: bookingDisputes.id,
        bookingId: bookingDisputes.bookingId,
        advisorEmail: bookingDisputes.advisorEmail,
        reason: bookingDisputes.reason,
        description: bookingDisputes.description,
        status: bookingDisputes.status,
        meetingJoinedByReviewer: bookingDisputes.meetingJoinedByReviewer,
        meetingJoinedByClient: bookingDisputes.meetingJoinedByClient,
        adminNotes: bookingDisputes.adminNotes,
        resolvedAt: bookingDisputes.resolvedAt,
        resolvedBy: bookingDisputes.resolvedBy,
        createdAt: bookingDisputes.createdAt,
        // Booking & Reviewer details
        internName: bookings.internName,
        advisorName: bookings.advisorName,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        reviewerId: bookings.reviewerId,
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        eventTypeName: eventTypes.name,
        // Payment info
        paymentAmount: payments.amount,
        paymentStatus: payments.status,
        razorpayPaymentId: payments.razorpayPaymentId,
      })
      .from(bookingDisputes)
      .innerJoin(bookings, eq(bookings.id, bookingDisputes.bookingId))
      .innerJoin(reviewers, eq(reviewers.id, bookings.reviewerId))
      .innerJoin(eventTypes, eq(eventTypes.id, bookings.eventTypeId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id));

    const whereClause = params.status
      ? eq(bookingDisputes.status, params.status)
      : undefined;

    const items = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(bookingDisputes.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRecord] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingDisputes)
      .where(whereClause ? whereClause : sql`true`);

    return {
      items,
      total: totalRecord?.count || 0,
      page,
      limit,
    };
  },

  adminResolveDispute: async (
    disputeId: number,
    adminId: number,
    data: {
      action: "refund_client" | "dismiss";
      adminNotes?: string;
    }
  ) => {
    const [dispute] = await db
      .select()
      .from(bookingDisputes)
      .where(eq(bookingDisputes.id, disputeId))
      .limit(1);

    if (!dispute) {
      throw new AppError("Dispute not found", 404);
    }

    if (dispute.status !== "under_review") {
      throw new AppError("This dispute has already been resolved", 400);
    }

    const [bookingData] = await db
      .select({
        id: bookings.id,
        advisorName: bookings.advisorName,
        advisorEmail: bookings.advisorEmail,
        reviewerId: bookings.reviewerId,
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        eventTypeName: eventTypes.name,
      })
      .from(bookings)
      .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(bookings.id, dispute.bookingId))
      .limit(1);

    let updatedResult;

    if (data.action === "refund_client") {
      // 100% full refund to client via Razorpay
      await refundService.processBookingRefund({
        bookingId: dispute.bookingId,
        initiatedBy: "system",
        reason: `Dispute approved: ${dispute.description}`,
      });

      const [updated] = await db
        .update(bookingDisputes)
        .set({
          status: "resolved_refunded",
          adminNotes: data.adminNotes || "Approved 100% refund for reviewer no-show/issue",
          resolvedAt: new Date(),
          resolvedBy: adminId,
        })
        .where(eq(bookingDisputes.id, disputeId))
        .returning();

      updatedResult = updated;
    } else {
      // Dismiss false/fraudulent dispute: unfreeze escrow so funds mature normally
      await db
        .update(walletTransactions)
        .set({ status: "completed" })
        .where(
          and(
            eq(walletTransactions.bookingId, dispute.bookingId),
            eq(walletTransactions.type, "credit_escrow")
          )
        );

      const [updated] = await db
        .update(bookingDisputes)
        .set({
          status: "resolved_dismissed",
          adminNotes: data.adminNotes || "Dispute dismissed; meeting attendance verified.",
          resolvedAt: new Date(),
          resolvedBy: adminId,
        })
        .where(eq(bookingDisputes.id, disputeId))
        .returning();

      updatedResult = updated;
    }

    if (bookingData) {
      const outcome = data.action === "refund_client" ? "resolved_refunded" : "resolved_dismissed";

      // 1. In-app notification to reviewer (live socket)
      await notificationService.createNotification({
        reviewerId: bookingData.reviewerId,
        type: "dispute_resolved",
        title: data.action === "refund_client" ? "Dispute resolved (Refund)" : "Dispute dismissed",
        message: data.action === "refund_client"
          ? `Dispute for Booking #${dispute.bookingId} (${bookingData.eventTypeName}) was approved with client refund.`
          : `Dispute for Booking #${dispute.bookingId} (${bookingData.eventTypeName}) was dismissed. Funds cleared.`,
        bookingId: dispute.bookingId,
      });

      // 2. Email to Advisor
      const advMail = disputeResolvedTemplate({
        recipientName: bookingData.advisorName,
        recipientRole: "advisor",
        bookingId: dispute.bookingId,
        eventTypeName: bookingData.eventTypeName,
        outcome,
        adminNotes: data.adminNotes,
      });
      const advMailData = disputeResolvedTemplateData({
        recipientName: bookingData.advisorName,
        recipientRole: "advisor",
        bookingId: dispute.bookingId,
        eventTypeName: bookingData.eventTypeName,
        outcome,
        adminNotes: data.adminNotes,
      });
      emailService.sendTemplateEmail({ to: bookingData.advisorEmail, templateId: advMailData.templateId, subject: advMailData.subject, variables: advMailData.variables, fallbackHtml: advMail.html }).catch((err) => {
        console.error("[Dispute] Failed to send advisor resolution email:", err);
      });

      // 3. Email to Reviewer
      const revMail = disputeResolvedTemplate({
        recipientName: bookingData.reviewerName,
        recipientRole: "reviewer",
        bookingId: dispute.bookingId,
        eventTypeName: bookingData.eventTypeName,
        outcome,
        adminNotes: data.adminNotes,
      });
      const revMailData = disputeResolvedTemplateData({
        recipientName: bookingData.reviewerName,
        recipientRole: "reviewer",
        bookingId: dispute.bookingId,
        eventTypeName: bookingData.eventTypeName,
        outcome,
        adminNotes: data.adminNotes,
      });
      emailService.sendTemplateEmail({ to: bookingData.reviewerEmail, templateId: revMailData.templateId, subject: revMailData.subject, variables: revMailData.variables, fallbackHtml: revMail.html }).catch((err) => {
        console.error("[Dispute] Failed to send reviewer resolution email:", err);
      });
    }

    // Record Audit Log for Dispute Resolution
    try {
      const [actorAdmin] = await db.select({ name: admins.name }).from(admins).where(eq(admins.id, adminId));
      await auditLogService.recordAuditLog({
        actorId: adminId,
        actorRole: "admin",
        actorName: actorAdmin?.name ?? "Admin",
        action: data.action === "refund_client" ? "dispute.resolved_refunded" : "dispute.dismissed",
        targetType: "dispute",
        targetId: disputeId,
        metadata: {
          bookingId: dispute.bookingId,
          action: data.action,
          adminNotes: data.adminNotes,
          advisorEmail: dispute.advisorEmail,
        },
      });
    } catch (auditErr) {
      console.error("[Dispute] Failed to record audit log:", auditErr);
    }

    return updatedResult;
  },
};