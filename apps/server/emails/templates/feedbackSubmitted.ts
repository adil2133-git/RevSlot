interface FeedbackSubmittedParams {
  recipientName: string;
  recipientRole: "advisor" | "intern";
  eventTypeName: string;
  reviewerName: string;
  internName: string;
  reviewMark: string | null;
  understandingLevel: string | null;
  taskMark: string | null;
  comments: string | null;
  isNoShow?: boolean;
}

export const FEEDBACK_SUBMITTED_TEMPLATE_ID = "revslot-feedback-submitted";

function buildEvaluationContent(params: FeedbackSubmittedParams): string {
  const { reviewerName, reviewMark, understandingLevel, taskMark, comments, isNoShow } = params;

  if (isNoShow) {
    return `
      <div style="margin: 20px 0; padding: 16px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; color: #991b1b; font-size: 14px;">
        <strong>Session Status:</strong> Marked as No-Show by the reviewer (${reviewerName}).
      </div>
    `;
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
      ${
        reviewMark !== null && reviewMark !== undefined
          ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 150px;">Review Score:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #003366; font-size: 15px;">${reviewMark}</td>
          </tr>
        `
          : ""
      }
      ${
        understandingLevel
          ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Understanding Level:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-transform: capitalize;">${understandingLevel.replace("_", " ")}</td>
          </tr>
        `
          : ""
      }
      ${
        taskMark !== null && taskMark !== undefined
          ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Task / Project Mark:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${taskMark}</td>
          </tr>
        `
          : ""
      }
    </table>

    ${
      comments
        ? `
        <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-left: 4px solid #003366; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b;">Reviewer Comments & Feedback</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${comments}</p>
        </div>
      `
        : ""
    }
  `;
}

// Variables + subject for emailService.sendTemplateEmail(). The isNoShow /
// present-fields branching happens in code and is passed in as one raw
// EVALUATION_CONTENT block, since Resend Templates don't support conditionals.
export const feedbackSubmittedTemplateData = (params: FeedbackSubmittedParams) => {
  const subject = params.isNoShow
    ? `Session Outcome: No-Show recorded for ${params.eventTypeName}`
    : `Review Feedback Available: ${params.eventTypeName} (${params.internName})`;

  return {
    templateId: FEEDBACK_SUBMITTED_TEMPLATE_ID,
    subject,
    variables: {
      RECIPIENT_NAME: params.recipientName,
      EVENT_TYPE_NAME: params.eventTypeName,
      REVIEWER_NAME: params.reviewerName,
      INTERN_NAME: params.internName,
      EVALUATION_CONTENT: buildEvaluationContent(params),
    },
  };
};

export const feedbackSubmittedTemplate = (params: FeedbackSubmittedParams) => {
  const { recipientName, eventTypeName, reviewerName, internName, isNoShow } = params;

  const subject = isNoShow
    ? `Session Outcome: No-Show recorded for ${eventTypeName}`
    : `Review Feedback Available: ${eventTypeName} (${internName})`;

  const evaluationContent = buildEvaluationContent(params);

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
            <p style="margin: 4px 0 0 0; color: #93c5fd; font-size: 12px; text-transform: uppercase; font-weight: 600;">Evaluation Report</p>
          </div>
          <div style="padding: 28px;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">Hello ${recipientName},</h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #475569;">
              Review feedback has been officially recorded by <strong>${reviewerName}</strong> for session <strong>${eventTypeName}</strong> with intern <strong>${internName}</strong>.
            </p>

            ${evaluationContent}

            <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.4; color: #94a3b8; text-align: center;">
              You can view complete history anytime through your RevSlot portal.
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