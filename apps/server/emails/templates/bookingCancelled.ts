interface CancelledEmailParams {
  recipientName: string;
  recipientRole: "advisor" | "reviewer" | "intern";
  eventTypeName: string;
  reviewerName: string;
  advisorName: string;
  formattedDate: string;
  formattedTime: string;
  reason: string;
}

function getRoleIntro(params: CancelledEmailParams): string {
  if (params.recipientRole === "advisor") {
    return "Your booking with " + params.reviewerName + " for <strong>" + params.eventTypeName + "</strong> has been cancelled.";
  }
  if (params.recipientRole === "reviewer") {
    return "You cancelled the session with " + params.advisorName + " — <strong>" + params.eventTypeName + "</strong>.";
  }
  return "The review session <strong>" + params.eventTypeName + "</strong> with " + params.reviewerName + " has been cancelled.";
}

export function bookingCancelledTemplate(params: CancelledEmailParams) {
  var recipientName = params.recipientName;
  var formattedDate = params.formattedDate;
  var formattedTime = params.formattedTime;
  var reason = params.reason;

  var subject = "Booking cancelled: " + params.eventTypeName;

  var html =
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">' +
    '<h2 style="color: #111827; margin-bottom: 8px;">Booking cancelled</h2>' +
    '<p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ' + recipientName + ',</p>' +
    '<p style="color: #374151; font-size: 15px; line-height: 1.6;">' + getRoleIntro(params) + '</p>' +
    '<div style="margin: 20px 0; padding: 16px 20px; border: 1px solid #e5e7eb; border-radius: 8px;">' +
    '<p style="margin: 0 0 4px 0; font-size: 14px; color: #111827; font-weight: 600;">' + formattedDate + '</p>' +
    '<p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">' + formattedTime + '</p>' +
    '<p style="margin: 0; font-size: 13px; color: #ba1a1a;">Reason: ' + reason + '</p>' +
    '</div>' +
    '<p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin-top: 24px;">Sent by RevSlot on behalf of ' + params.reviewerName + '.</p>' +
    '</div>';

  return {
    subject: subject,
    html: html,
  };
}