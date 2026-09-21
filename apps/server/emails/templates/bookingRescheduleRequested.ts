import { BRAND, renderEmailShell, renderInfoCard, renderFooter, renderPrimaryButton } from "../layout.js";

interface RescheduleRequestedEmailParams {
  recipientName: string;
  eventTypeName: string;
  reviewerName: string;
  advisorName: string;
  internName: string;
  currentFormattedDate: string;
  currentFormattedTime: string;
  proposedFormattedDate: string;
  proposedFormattedTime: string;
  reason?: string | undefined;
  actionUrl: string;
}

export const BOOKING_RESCHEDULE_REQUESTED_TEMPLATE_ID = "revslot-booking-reschedule-requested";

function buildReasonBlock(reason: string | undefined, reviewerName: string): string {
  if (!reason) return "";
  return (
    `<div style="margin: 16px 0; padding: 12px 16px; background-color: ${BRAND.warnBg}; border-left: 4px solid ${BRAND.warnBorder}; border-radius: 4px;">` +
    `<p style="margin: 0; font-size: 13px; color: ${BRAND.warnText}; font-weight: 600;">Message from ${reviewerName}:</p>` +
    `<p style="margin: 4px 0 0 0; font-size: 14px; color: #78350f;">"${reason}"</p>` +
    `</div>`
  );
}

export const bookingRescheduleRequestedTemplateData = (params: RescheduleRequestedEmailParams) => ({
  templateId: BOOKING_RESCHEDULE_REQUESTED_TEMPLATE_ID,
  subject: `Reschedule Requested: ${params.eventTypeName} with ${params.reviewerName}`,
  variables: {
    RECIPIENT_NAME: params.recipientName,
    REVIEWER_NAME: params.reviewerName,
    EVENT_TYPE_NAME: params.eventTypeName,
    REASON_BLOCK: buildReasonBlock(params.reason, params.reviewerName),
    CURRENT_FORMATTED_DATE: params.currentFormattedDate,
    CURRENT_FORMATTED_TIME: params.currentFormattedTime,
    PROPOSED_FORMATTED_DATE: params.proposedFormattedDate,
    PROPOSED_FORMATTED_TIME: params.proposedFormattedTime,
    ACTION_URL: params.actionUrl,
  },
});

export function bookingRescheduleRequestedTemplate(params: RescheduleRequestedEmailParams) {
  const {
    recipientName,
    eventTypeName,
    reviewerName,
    currentFormattedDate,
    currentFormattedTime,
    proposedFormattedDate,
    proposedFormattedTime,
    reason,
    actionUrl,
  } = params;

  const subject = `Reschedule Requested: ${eventTypeName} with ${reviewerName}`;

  const html = renderEmailShell({
    subtitle: "Reschedule Requested",
    maxWidth: 520,
    bodyHtml:
      `<p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi ${recipientName},</p>` +
      `<p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">` +
      `Reviewer <strong>${reviewerName}</strong> has requested to reschedule your <strong>${eventTypeName}</strong> session.` +
      `</p>` +
      buildReasonBlock(reason, reviewerName) +
      renderInfoCard(
        `<p style="margin: 0 0 8px 0; font-size: 13px; color: ${BRAND.muted};">Current Session Time:</p>` +
        `<p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 500; text-decoration: line-through;">${currentFormattedDate}, ${currentFormattedTime}</p>` +
        `<p style="margin: 0 0 4px 0; font-size: 13px; color: #0284c7; font-weight: 600;">Proposed New Time:</p>` +
        `<p style="margin: 0; font-size: 16px; color: #0369a1; font-weight: 700;">${proposedFormattedDate}, ${proposedFormattedTime}</p>`
      ) +
      renderPrimaryButton(actionUrl, "Respond to Reschedule Request") +
      `<p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.5;">` +
      `You can accept the proposed time, pick an alternative time that fits your availability, or decline and cancel the session.` +
      `</p>` +
      renderFooter(reviewerName),
  });

  return { subject, html };
}