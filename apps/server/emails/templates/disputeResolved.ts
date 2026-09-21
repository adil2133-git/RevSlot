interface DisputeResolvedParams {
  recipientName: string;
  recipientRole: "advisor" | "reviewer";
  bookingId: number;
  eventTypeName: string;
  outcome: "resolved_refunded" | "resolved_dismissed";
  adminNotes?: string | null | undefined;
}

export const DISPUTE_RESOLVED_TEMPLATE_ID = "revslot-dispute-resolved";

function getBodyText(params: DisputeResolvedParams): string {
  const { recipientRole, eventTypeName, bookingId, outcome } = params;
  const isRefunded = outcome === "resolved_refunded";

  if (recipientRole === "advisor") {
    return isRefunded
      ? `Your dispute for session <strong>${eventTypeName}</strong> (Booking #${bookingId}) has been <strong>approved</strong>. A 100% refund has been processed back to your original payment method via Razorpay (typically reflects in 5-7 business days).`
      : `Your dispute for session <strong>${eventTypeName}</strong> (Booking #${bookingId}) has been <strong>reviewed and dismissed</strong> following review of meeting attendance records.`;
  }
  return isRefunded
    ? `The dispute for session <strong>${eventTypeName}</strong> (Booking #${bookingId}) has been resolved with a full refund granted to the client. Escrow funds for this session have been cancelled.`
    : `The dispute for session <strong>${eventTypeName}</strong> (Booking #${bookingId}) has been <strong>dismissed</strong>. Meeting logs confirmed your attendance. Your escrow payment has been released to your available balance.`;
}

function buildAdminNotesSection(adminNotes?: string | null): string {
  if (!adminNotes) return "";
  return `
    <div style="margin: 20px 0; padding: 14px; background: #f8fafc; border-left: 4px solid #003366; border-radius: 4px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b;">Administrator Notes</p>
      <p style="margin: 0; font-size: 13px; color: #334155;">${adminNotes}</p>
    </div>
  `;
}

// Variables + subject for emailService.sendTemplateEmail(). The role/outcome
// branching (headline, banner color, body copy) happens in code — Resend
// Templates don't support conditionals.
export const disputeResolvedTemplateData = (params: DisputeResolvedParams) => {
  const isRefunded = params.outcome === "resolved_refunded";
  const headline = isRefunded ? "Dispute Approved & Refund Processed" : "Dispute Reviewed & Dismissed";
  const bannerColor = isRefunded ? "#003366" : "#475569";
  const headlineColor = isRefunded ? "#003366" : "#334155";

  return {
    templateId: DISPUTE_RESOLVED_TEMPLATE_ID,
    subject: `Dispute Resolution: Booking #${params.bookingId}`,
    variables: {
      RECIPIENT_NAME: params.recipientName,
      BOOKING_ID: String(params.bookingId),
      EVENT_TYPE_NAME: params.eventTypeName,
      HEADLINE: headline,
      HEADLINE_COLOR: headlineColor,
      BANNER_COLOR: bannerColor,
      BODY_TEXT: getBodyText(params),
      ADMIN_NOTES_SECTION: buildAdminNotesSection(params.adminNotes),
    },
  };
};

export const disputeResolvedTemplate = (params: DisputeResolvedParams) => {
  const { recipientName, bookingId, outcome, adminNotes } = params;

  const isRefunded = outcome === "resolved_refunded";
  const subject = `Dispute Resolution: Booking #${bookingId}`;
  const headline = isRefunded ? "Dispute Approved & Refund Processed" : "Dispute Reviewed & Dismissed";
  const bannerColor = isRefunded ? "#003366" : "#475569";
  const bodyText = getBodyText(params);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: ${bannerColor}; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">RevSlot</h1>
            <p style="margin: 4px 0 0 0; color: #e2e8f0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Resolution Notice</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">Hello ${recipientName},</h2>
            <h3 style="margin: 0 0 16px 0; font-size: 15px; color: ${isRefunded ? '#003366' : '#334155'}; font-weight: 700;">${headline}</h3>
            
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              ${bodyText}
            </p>

            ${buildAdminNotesSection(adminNotes)}

            <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.4; color: #94a3b8; text-align: center;">
              For any questions regarding this resolution, reply directly to this email or visit RevSlot Support.
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