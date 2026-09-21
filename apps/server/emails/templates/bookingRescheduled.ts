import { BRAND, renderEmailShell, renderInfoCard, renderFooter, renderPrimaryButton } from "../layout.js";

interface RescheduledEmailParams {
  recipientName: string;
  recipientRole: "advisor" | "reviewer" | "intern";
  eventTypeName: string;
  reviewerName: string;
  advisorName: string;
  oldFormattedDate: string;
  oldFormattedTime: string;
  newFormattedDate: string;
  newFormattedTime: string;
  meetLink: string | null;
}

function getRoleIntro(params: RescheduledEmailParams): string {
  if (params.recipientRole === "advisor") {
    return "Your booking with " + params.reviewerName + " for <strong>" + params.eventTypeName + "</strong> has been rescheduled.";
  }
  if (params.recipientRole === "reviewer") {
    return "You rescheduled the session with " + params.advisorName + " — <strong>" + params.eventTypeName + "</strong>.";
  }
  return "The review session <strong>" + params.eventTypeName + "</strong> with " + params.reviewerName + " has a new time.";
}

export const BOOKING_RESCHEDULED_TEMPLATE_ID = "revslot-booking-rescheduled";

function buildMeetSection(meetLink: string | null): string {
  if (!meetLink) return "";
  return (
    `<div style="margin: 24px 0; padding: 16px; background: ${BRAND.primaryLight}; border-radius: 8px; text-align: center;">` +
    `<p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND.muted};">Join with Google Meet</p>` +
    renderPrimaryButton(meetLink, "Join meeting") +
    `</div>`
  );
}

export const bookingRescheduledTemplateData = (params: RescheduledEmailParams) => ({
  templateId: BOOKING_RESCHEDULED_TEMPLATE_ID,
  subject: "Booking rescheduled: " + params.eventTypeName,
  variables: {
    RECIPIENT_NAME: params.recipientName,
    ROLE_INTRO: getRoleIntro(params),
    OLD_FORMATTED_DATE: params.oldFormattedDate,
    OLD_FORMATTED_TIME: params.oldFormattedTime,
    NEW_FORMATTED_DATE: params.newFormattedDate,
    NEW_FORMATTED_TIME: params.newFormattedTime,
    MEET_SECTION: buildMeetSection(params.meetLink),
    REVIEWER_NAME: params.reviewerName,
  },
});

export function bookingRescheduledTemplate(params: RescheduledEmailParams) {
  const { recipientName, oldFormattedDate, oldFormattedTime, newFormattedDate, newFormattedTime, meetLink } = params;
  const subject = "Booking rescheduled: " + params.eventTypeName;

  const html = renderEmailShell({
    subtitle: "Booking Rescheduled",
    bodyHtml:
      `<p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi ${recipientName},</p>` +
      `<p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">${getRoleIntro(params)}</p>` +
      `<div style="margin: 16px 0; padding: 12px 16px; border: 1px solid ${BRAND.border}; border-radius: 8px; opacity: 0.6;">` +
      `<p style="margin: 0; font-size: 12px; color: ${BRAND.faint}; text-decoration: line-through;">Previously: ${oldFormattedDate}, ${oldFormattedTime}</p>` +
      `</div>` +
      renderInfoCard(
        `<p style="margin: 0 0 4px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">New time: ${newFormattedDate}</p>` +
        `<p style="margin: 0; font-size: 13px; color: ${BRAND.muted};">${newFormattedTime}</p>`,
        BRAND.primary
      ) +
      buildMeetSection(meetLink) +
      renderFooter(params.reviewerName),
  });

  return { subject, html };
}