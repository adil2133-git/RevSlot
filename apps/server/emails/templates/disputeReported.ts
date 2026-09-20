interface DisputeReportedParams {
  recipientName: string;
  recipientRole: "advisor" | "reviewer" | "admin";
  bookingId: number;
  eventTypeName: string;
  reason: string;
  description: string;
  reviewerName: string;
  advisorName: string;
  advisorEmail: string;
}

const reasonLabels: Record<string, string> = {
  reviewer_no_show: "Reviewer No-Show",
  technical_issue: "Technical / Connectivity Issue",
  inadequate_review: "Inadequate or Incomplete Review",
  other: "Other Grievance",
};

export const disputeReportedTemplate = (params: DisputeReportedParams) => {
  const {
    recipientName,
    recipientRole,
    bookingId,
    eventTypeName,
    reason,
    description,
    reviewerName,
    advisorName,
  } = params;

  const humanReason = reasonLabels[reason] || reason;

  let subject: string;
  let intro: string;

  if (recipientRole === "advisor") {
    subject = `Dispute Received: Booking #${bookingId}`;
    intro = `We have received your report regarding your session with <strong>${reviewerName}</strong>. Our administration team is actively investigating the meeting logs and will issue a resolution within 48 hours.`;
  } else if (recipientRole === "reviewer") {
    subject = `Action Notice: Issue reported for Booking #${bookingId}`;
    intro = `An issue has been reported by <strong>${advisorName}</strong> for your session <strong>${eventTypeName}</strong>. Related payout funds are temporarily held in escrow pending administrative review.`;
  } else {
    subject = `[Admin Alert] New Dispute Filed: Booking #${bookingId}`;
    intro = `Advisor <strong>${advisorName}</strong> has filed a dispute for session <strong>${eventTypeName}</strong> with reviewer <strong>${reviewerName}</strong>.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: #991b1b; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">RevSlot</h1>
            <p style="margin: 4px 0 0 0; color: #fecaca; font-size: 12px; text-transform: uppercase; font-weight: 600;">Dispute & Resolution Center</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">Hello ${recipientName},</h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #475569;">
              ${intro}
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b; width: 140px;">Booking ID:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">#${bookingId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b;">Session Type:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${eventTypeName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; color: #64748b;">Reported Reason:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #b91c1c;">${humanReason}</td>
              </tr>
            </table>

            <div style="margin: 20px 0; padding: 16px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #991b1b;">Report Description</p>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7f1d1d; white-space: pre-wrap;">${description}</p>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.4; color: #94a3b8; text-align: center;">
              RevSlot Support team will reach out if further clarification is required.
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
