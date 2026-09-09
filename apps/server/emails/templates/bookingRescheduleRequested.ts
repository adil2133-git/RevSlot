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

  const reasonBlock = reason
    ? `<div style="margin: 16px 0; padding: 12px 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">` +
      `<p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">Message from ${reviewerName}:</p>` +
      `<p style="margin: 4px 0 0 0; font-size: 14px; color: #78350f;">"${reason}"</p>` +
      `</div>`
    : "";

  const html =
    `<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">` +
    `<h2 style="color: #111827; margin-bottom: 8px;">Reschedule Requested</h2>` +
    `<p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${recipientName},</p>` +
    `<p style="color: #374151; font-size: 15px; line-height: 1.6;">` +
    `Reviewer <strong>${reviewerName}</strong> has requested to reschedule your <strong>${eventTypeName}</strong> session.` +
    `</p>` +
    reasonBlock +
    `<div style="margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">` +
    `<p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">Current Session Time:</p>` +
    `<p style="margin: 0 0 16px 0; font-size: 14px; color: #111827; font-weight: 500; text-decoration: line-through;">${currentFormattedDate}, ${currentFormattedTime}</p>` +
    `<p style="margin: 0 0 4px 0; font-size: 13px; color: #0284c7; font-weight: 600;">Proposed New Time:</p>` +
    `<p style="margin: 0; font-size: 16px; color: #0369a1; font-weight: 700;">${proposedFormattedDate}, ${proposedFormattedTime}</p>` +
    `</div>` +
    `<div style="margin: 28px 0; text-align: center;">` +
    `<a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background: #003366; color: #ffffff; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none;">Respond to Reschedule Request</a>` +
    `</div>` +
    `<p style="color: #6b7280; font-size: 13px; line-height: 1.5;">` +
    `You can accept the proposed time, pick an alternative time that fits your availability, or decline and cancel the session.` +
    `</p>` +
    `<p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin-top: 24px;">Sent by RevSlot on behalf of ${reviewerName}.</p>` +
    `</div>`;

  return {
    subject,
    html,
  };
}
