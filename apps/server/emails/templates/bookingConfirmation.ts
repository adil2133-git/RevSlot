import { BRAND, renderEmailShell, renderInfoCard, renderFooter, renderPrimaryButton } from "../layout.js";

interface BookingEmailParams {
  recipientName: string;

  recipientRole: "advisor" | "reviewer" | "intern";

  eventTypeName: string;
  reviewerName: string;
  internName: string;
  advisorName: string;

  formattedDate: string;
  formattedTime: string;

  meetLink: string | null;
  price?: number | null | undefined;
  paymentId?: string | null | undefined;
}

const roleIntro: Record<
  BookingEmailParams["recipientRole"],
  (p: BookingEmailParams) => string
> = {
  advisor: (p) =>
    `Your booking with ${p.reviewerName} for <strong>${p.eventTypeName}</strong> is confirmed.`,

  reviewer: (p) =>
    `${p.advisorName} booked a new session with you - <strong>${p.eventTypeName}</strong>.`,

  intern: (p) =>
    `You've been added to a review session - <strong>${p.eventTypeName}</strong> with ${p.reviewerName}.`,
};

export const BOOKING_CONFIRMATION_TEMPLATE_ID = "revslot-booking-confirmation";

function buildMeetSection(meetLink: string | null): string {
  return meetLink
    ? `
      <div style="margin: 24px 0; padding: 16px; background: ${BRAND.primaryLight}; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND.muted};">
          Join with Google Meet
        </p>
        ${renderPrimaryButton(meetLink, "Join meeting")}
      </div>
    `
    : `
      <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6;">
        A meeting link hasn't been set up yet - the reviewer will share one separately before the session.
      </p>
    `;
}

function buildPaymentSection(price?: number | null, paymentId?: string | null): string {
  if (price == null) return "";
  return `
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed ${BRAND.border};">
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${BRAND.text};">
        Payment: ${price > 0 ? `<span style="color: #047857;">Paid ₹${price}</span>` : '<span style="color: #4b5563;">Free Session</span>'}
      </p>
      ${paymentId ? `<p style="margin: 3px 0 0 0; font-size: 11px; font-family: monospace; color: ${BRAND.faint};">Receipt: ${paymentId}</p>` : ""}
    </div>
  `;
}

// Variables + subject for emailService.sendTemplateEmail(). The role intro
// and the meet/payment sections still branch in code (Resend Templates
// don't support conditionals), then get injected as raw HTML variables
// (use {{{TRIPLE_BRACES}}} for these in the Resend template body).
export const bookingConfirmationTemplateData = (params: BookingEmailParams) => {
  const subject =
    params.recipientRole === "reviewer"
      ? `New booking: ${params.eventTypeName} with ${params.advisorName}`
      : `Booking confirmed: ${params.eventTypeName}`;

  return {
    templateId: BOOKING_CONFIRMATION_TEMPLATE_ID,
    subject,
    variables: {
      RECIPIENT_NAME: params.recipientName,
      ROLE_INTRO: roleIntro[params.recipientRole](params),
      FORMATTED_DATE: params.formattedDate,
      FORMATTED_TIME: params.formattedTime,
      INTERN_NAME: params.internName,
      PAYMENT_SECTION: buildPaymentSection(params.price, params.paymentId),
      MEET_SECTION: buildMeetSection(params.meetLink),
      REVIEWER_NAME: params.reviewerName,
    },
  };
};

export const bookingConfirmationTemplate = (params: BookingEmailParams) => {
  const { recipientName, recipientRole, formattedDate, formattedTime, meetLink, internName } = params;

  const subject =
    recipientRole === "reviewer"
      ? `New booking: ${params.eventTypeName} with ${params.advisorName}`
      : `Booking confirmed: ${params.eventTypeName}`;

  const html = renderEmailShell({
    subtitle: "Booking Confirmed",
    bodyHtml: `
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi ${recipientName},</p>
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">${roleIntro[recipientRole](params)}</p>
      ${renderInfoCard(`
        <p style="margin: 0 0 4px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">${formattedDate}</p>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND.muted};">${formattedTime}</p>
        <p style="margin: 0; font-size: 13px; color: ${BRAND.muted};">Intern: ${internName}</p>
        ${buildPaymentSection(params.price, params.paymentId)}
      `)}
      ${buildMeetSection(meetLink)}
      ${renderFooter(params.reviewerName)}
    `,
  });

  return { subject, html };
};