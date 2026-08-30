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

export function bookingRescheduledTemplate(params: RescheduledEmailParams) {
  var recipientName = params.recipientName;
  var oldFormattedDate = params.oldFormattedDate;
  var oldFormattedTime = params.oldFormattedTime;
  var newFormattedDate = params.newFormattedDate;
  var newFormattedTime = params.newFormattedTime;
  var meetLink = params.meetLink;

  var subject = "Booking rescheduled: " + params.eventTypeName;

  var meetSection = "";
  if (meetLink) {
    meetSection =
      '<div style="margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">' +
      '<p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">Join with Google Meet</p>' +
      '<a href="' + meetLink + '" style="display: inline-block; padding: 10px 20px; background: #003366; color: #ffffff; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">Join meeting</a>' +
      '</div>';
  }

  var html =
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">' +
    '<h2 style="color: #111827; margin-bottom: 8px;">Booking rescheduled</h2>' +
    '<p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ' + recipientName + ',</p>' +
    '<p style="color: #374151; font-size: 15px; line-height: 1.6;">' + getRoleIntro(params) + '</p>' +
    '<div style="margin: 16px 0; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; opacity: 0.6;">' +
    '<p style="margin: 0; font-size: 12px; color: #9ca3af; text-decoration: line-through;">Previously: ' + oldFormattedDate + ', ' + oldFormattedTime + '</p>' +
    '</div>' +
    '<div style="margin: 0 0 20px 0; padding: 16px 20px; border: 1px solid #003366; border-radius: 8px;">' +
    '<p style="margin: 0 0 4px 0; font-size: 14px; color: #111827; font-weight: 600;">New time: ' + newFormattedDate + '</p>' +
    '<p style="margin: 0; font-size: 13px; color: #6b7280;">' + newFormattedTime + '</p>' +
    '</div>' +
    meetSection +
    '<p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin-top: 24px;">Sent by RevSlot on behalf of ' + params.reviewerName + '.</p>' +
    '</div>';

  return {
    subject: subject,
    html: html,
  };
}