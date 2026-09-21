interface SessionReminderParams {
  recipientName: string;
  recipientRole: "advisor" | "reviewer" | "intern";
  eventTypeName: string;
  reviewerName: string;
  internName: string;
  advisorName: string;
  formattedDate: string;
  formattedTime: string;
  meetLink: string | null;
  startsInText?: string; // e.g. "in 1 hour" or "soon"
}

export const SESSION_REMINDER_TEMPLATE_ID = "revslot-session-reminder";

function buildMeetSection(meetLink: string | null): string {
  return meetLink
    ? `
      <div style="margin: 24px 0; padding: 18px; background: #f0f7ff; border: 1px solid #cce3ff; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #003366; font-weight: 600;">
          Ready to join the session?
        </p>
        <a
          href="${meetLink}"
          style="display: inline-block; padding: 12px 24px; background: #003366; color: #ffffff; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;"
        >
          Join Meeting Room
        </a>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b;">
          Or copy link: <a href="${meetLink}" style="color: #0284c7;">${meetLink}</a>
        </p>
      </div>
    `
    : `
      <div style="margin: 24px 0; padding: 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; text-align: center; color: #b45309; font-size: 13px;">
        Meeting link will be provided in your dashboard before start time.
      </div>
    `;
}

// Variables + subject for emailService.sendTemplateEmail(). meetLink
// presence branching happens in code and is passed in as the raw
// MEET_SECTION block, since Resend Templates don't support conditionals.
export const sessionReminderTemplateData = (params: SessionReminderParams) => {
  const startsInText = params.startsInText ?? "in 1 hour";

  return {
    templateId: SESSION_REMINDER_TEMPLATE_ID,
    subject: `Reminder: ${params.eventTypeName} starts ${startsInText}`,
    variables: {
      RECIPIENT_NAME: params.recipientName,
      EVENT_TYPE_NAME: params.eventTypeName,
      REVIEWER_NAME: params.reviewerName,
      INTERN_NAME: params.internName,
      ADVISOR_NAME: params.advisorName,
      FORMATTED_DATE: params.formattedDate,
      FORMATTED_TIME: params.formattedTime,
      STARTS_IN_TEXT: startsInText,
      MEET_SECTION: buildMeetSection(params.meetLink),
    },
  };
};

export const sessionReminderTemplate = (params: SessionReminderParams) => {
  const {
    recipientName,
    eventTypeName,
    reviewerName,
    internName,
    advisorName,
    formattedDate,
    formattedTime,
    meetLink,
    startsInText = "in 1 hour",
  } = params;

  const subject = `Reminder: ${eventTypeName} starts ${startsInText}`;
  const meetSection = buildMeetSection(meetLink);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: #003366; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">RevSlot</h1>
            <p style="margin: 4px 0 0 0; color: #93c5fd; font-size: 12px; text-transform: uppercase; font-weight: 600;">Upcoming Session Alert</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">Hello ${recipientName},</h2>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #475569;">
              This is a friendly reminder that your review session <strong>${eventTypeName}</strong> is scheduled to start <strong>${startsInText}</strong>.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b; width: 120px;">Reviewer:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${reviewerName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b;">Advisor:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${advisorName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b;">Intern:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${internName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b;">Date & Time:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${formattedDate} at ${formattedTime}</td>
              </tr>
            </table>

            ${meetSection}

            <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.4; color: #94a3b8; text-align: center;">
              Please make sure your microphone and camera are working before joining.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 14px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            © RevSlot Academic Scheduling. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
};