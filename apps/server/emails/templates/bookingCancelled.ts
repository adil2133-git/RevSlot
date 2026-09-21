import { BRAND, renderEmailShell, renderInfoCard, renderFooter } from "../layout.js";

interface CancelledEmailParams {
  recipientName: string;
  recipientRole: "advisor" | "reviewer" | "intern";
  eventTypeName: string;
  reviewerName: string;
  advisorName: string;
  formattedDate: string;
  formattedTime: string;
  reason: string;
  refundStatusText?: string | null | undefined;
}

function getRoleIntro(params: CancelledEmailParams): string {
  if (params.recipientRole === "advisor") {
    return "Your booking with " + params.reviewerName + " for <strong>" + params.eventTypeName + "</strong> has been cancelled.";
  }
  if (params.recipientRole === "reviewer") {
    return "You cancelled the session with " + params.advisorName + " — <strong>" + params.eventTypeName + "</strong>.";
  }
  return "The review session <strong>" + params.eventTypeName + "</strong> with " + params.reviewerName + " has been cancelled.";
}

export const BOOKING_CANCELLED_TEMPLATE_ID = "revslot-booking-cancelled";

function buildRefundSection(refundStatusText?: string | null): string {
  if (!refundStatusText) return "";
  return (
    '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed ' + BRAND.border + ';">' +
    '<p style="margin: 0; font-size: 13px; font-weight: 600; color: ' + BRAND.text + ';">Refund Status:</p>' +
    '<p style="margin: 2px 0 0 0; font-size: 12px; color: #4b5563;">' + refundStatusText + '</p>' +
    '</div>'
  );
}

export const bookingCancelledTemplateData = (params: CancelledEmailParams) => ({
  templateId: BOOKING_CANCELLED_TEMPLATE_ID,
  subject: "Booking cancelled: " + params.eventTypeName,
  variables: {
    RECIPIENT_NAME: params.recipientName,
    ROLE_INTRO: getRoleIntro(params),
    FORMATTED_DATE: params.formattedDate,
    FORMATTED_TIME: params.formattedTime,
    REASON: params.reason,
    REFUND_SECTION: buildRefundSection(params.refundStatusText),
    REVIEWER_NAME: params.reviewerName,
  },
});

export function bookingCancelledTemplate(params: CancelledEmailParams) {
  const { recipientName, formattedDate, formattedTime, reason } = params;
  const subject = "Booking cancelled: " + params.eventTypeName;

  const html = renderEmailShell({
    subtitle: "Booking Cancelled",
    bodyHtml:
      `<p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi ${recipientName},</p>` +
      `<p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">${getRoleIntro(params)}</p>` +
      renderInfoCard(
        `<p style="margin: 0 0 4px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">${formattedDate}</p>` +
        `<p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND.muted};">${formattedTime}</p>` +
        `<p style="margin: 0; font-size: 13px; color: ${BRAND.danger};">Reason: ${reason}</p>` +
        buildRefundSection(params.refundStatusText)
      ) +
      renderFooter(params.reviewerName),
  });

  return { subject, html };
}