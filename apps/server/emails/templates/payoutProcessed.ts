interface PayoutProcessedParams {
  reviewerName: string;
  amountPaise: number;
  status: "completed" | "rejected";
  transactionReference?: string | null | undefined;
  adminNotes?: string | null | undefined;
}

export const payoutProcessedTemplate = (params: PayoutProcessedParams) => {
  const {
    reviewerName,
    amountPaise,
    status,
    transactionReference,
    adminNotes,
  } = params;

  const amountRupees = (amountPaise / 100).toFixed(2);
  const isApproved = status === "completed";

  const subject = isApproved
    ? `Payout Processed: ₹${amountRupees} has been transferred`
    : `Payout Request Rejected: ₹${amountRupees}`;

  const bannerColor = isApproved ? "#003366" : "#b91c1c";

  const statusContent = isApproved
    ? `
      <div style="margin: 20px 0; padding: 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #15803d;">Transfer Completed</p>
        <p style="margin: 0; font-size: 14px; color: #166534;">
          Your payout of <strong>₹${amountRupees}</strong> has been processed to your registered account.
        </p>
        ${
          transactionReference
            ? `
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #15803d;">
              <strong>Bank/UPI Reference:</strong> ${transactionReference}
            </p>
          `
            : ""
        }
      </div>
    `
    : `
      <div style="margin: 20px 0; padding: 18px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #b91c1c;">Payout Request Rejected</p>
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          Your payout request for <strong>₹${amountRupees}</strong> was not processed. The amount has been returned to your Available Balance.
        </p>
        ${
          adminNotes
            ? `
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #7f1d1d;">
              <strong>Reason:</strong> ${adminNotes}
            </p>
          `
            : ""
        }
      </div>
    `;

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
            <p style="margin: 4px 0 0 0; color: #e2e8f0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Wallet & Payouts</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">Hello ${reviewerName},</h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #475569;">
              Here is an update regarding your recent withdrawal request.
            </p>

            ${statusContent}

            <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.4; color: #94a3b8; text-align: center;">
              You can review your updated wallet transactions anytime under Dashboard > Wallet.
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
