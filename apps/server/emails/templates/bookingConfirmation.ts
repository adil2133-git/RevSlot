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

export const bookingConfirmationTemplate = (
  params: BookingEmailParams
) => {
  const {
    recipientName,
    recipientRole,
    formattedDate,
    formattedTime,
    meetLink,
    internName,
  } = params;

  const subject =
    recipientRole === "reviewer"
      ? `New booking: ${params.eventTypeName} with ${params.advisorName}`
      : `Booking confirmed: ${params.eventTypeName}`;

  const meetSection = meetLink
    ? `
      <div style="margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">
          Join with Google Meet
        </p>

        <a
          href="${meetLink}"
          style="display: inline-block; padding: 10px 20px; background: #003366; color: #ffffff; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;"
        >
          Join meeting
        </a>
      </div>
    `
    : `
      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        A meeting link hasn't been set up yet - the reviewer will share one separately before the session.
      </p>
    `;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">

      <h2 style="color: #111827; margin-bottom: 8px;">
        Booking confirmed
      </h2>

      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Hi ${recipientName},
      </p>

      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        ${roleIntro[recipientRole](params)}
      </p>

      <div style="margin: 20px 0; padding: 16px 20px; border: 1px solid #e5e7eb; border-radius: 8px;">

        <p style="margin: 0 0 4px 0; font-size: 14px; color: #111827; font-weight: 600;">
          ${formattedDate}
        </p>

        <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">
          ${formattedTime}
        </p>

        <p style="margin: 0; font-size: 13px; color: #6b7280;">
          Intern: ${internName}
        </p>

      </div>

      ${meetSection}

      <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin-top: 24px;">
        Sent by RevSlot on behalf of ${params.reviewerName}.
      </p>

    </div>
  `;

  return {
    subject,
    html,
  };
};