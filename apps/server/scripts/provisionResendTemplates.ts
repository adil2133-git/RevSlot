/**
 * Pushes RevSlot's email templates into Resend's dashboard as inbuilt
 * "Templates" (https://resend.com/docs/dashboard/templates/introduction),
 * instead of you having to build each one by hand in the no-code editor.
 *
 * Run once (and again any time you change a skeleton below):
 *
 *   pnpm --filter server exec tsx scripts/provisionResendTemplates.ts
 *
 * or, from apps/server:
 *
 *   pnpm exec tsx scripts/provisionResendTemplates.ts
 *
 * Idempotent — re-running updates the existing templates instead of
 * duplicating them (matched by `alias`, which is the same string as the
 * `xxxTemplateId` constants exported from emails/templates/*.ts).
 *
 * Requires RESEND_API_KEY in your .env. Uses variables (not conditionals —
 * Resend Templates don't support branching), so anything that varies by
 * role/state (intro text, meet link, payment/refund blocks) is passed in
 * as a pre-rendered raw HTML variable from the corresponding *TemplateData()
 * function in emails/templates/*.ts — see email.service.ts's
 * sendTemplateEmail() for how these get used at send time.
 */
import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";
import { BRAND, renderEmailShell, renderCodeBox, renderInfoCard, renderFooter, renderPrimaryButton } from "../emails/layout.js";

import { VERIFY_EMAIL_TEMPLATE_ID } from "../emails/templates/verifyEmail.js";
import { FORGOT_PASSWORD_TEMPLATE_ID } from "../emails/templates/forgotPassword.js";
import { ADVISOR_OTP_TEMPLATE_ID } from "../emails/templates/advisorOtp.js";
import { BOOKING_CONFIRMATION_TEMPLATE_ID } from "../emails/templates/bookingConfirmation.js";
import { BOOKING_CANCELLED_TEMPLATE_ID } from "../emails/templates/bookingCancelled.js";
import { BOOKING_RESCHEDULED_TEMPLATE_ID } from "../emails/templates/bookingRescheduled.js";
import { BOOKING_RESCHEDULE_REQUESTED_TEMPLATE_ID } from "../emails/templates/bookingRescheduleRequested.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set — add it to apps/server/.env first.");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

type VariableDef = { key: string; type: "string" | "number"; fallbackValue?: string | number | null };

interface TemplateDef {
  alias: string;
  name: string;
  subject: string;
  html: string;
  variables: VariableDef[];
}

// Note: every {{{VARIABLE}}} below is a literal placeholder string, not a
// real value — renderEmailShell() and friends just assemble HTML, so they
// don't care whether the content they're wrapping is real data or a
// placeholder. This keeps the dashboard skeleton pixel-identical to the
// fallback HTML built in emails/templates/*.ts.
const templates: TemplateDef[] = [
  {
    alias: VERIFY_EMAIL_TEMPLATE_ID,
    name: "RevSlot — Verify Email",
    subject: "Verify your RevSlot email address",
    html: renderEmailShell({
      subtitle: "Email Verification",
      bodyHtml: `
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi {{{NAME}}},</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
          Thanks for signing up for RevSlot. Enter the code below to verify your email and activate your reviewer account.
        </p>
        ${renderCodeBox("{{{OTP_CODE}}}")}
        <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6; text-align: center;">
          This code expires in 10 minutes. If you didn't create a RevSlot account, you can safely ignore this email.
        </p>
      `,
    }),
    variables: [
      { key: "NAME", type: "string", fallbackValue: "there" },
      { key: "OTP_CODE", type: "string", fallbackValue: "000000" },
    ],
  },
  {
    alias: FORGOT_PASSWORD_TEMPLATE_ID,
    name: "RevSlot — Forgot Password",
    subject: "Reset your RevSlot password",
    html: renderEmailShell({
      subtitle: "Password Reset",
      bodyHtml: `
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi {{{NAME}}},</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
          Use the code below to reset your RevSlot password. This code expires in 10 minutes.
        </p>
        ${renderCodeBox("{{{OTP_CODE}}}")}
        <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email — your password won't change.
        </p>
      `,
    }),
    variables: [
      { key: "NAME", type: "string", fallbackValue: "there" },
      { key: "OTP_CODE", type: "string", fallbackValue: "000000" },
    ],
  },
  {
    alias: ADVISOR_OTP_TEMPLATE_ID,
    name: "RevSlot — Advisor OTP",
    // Overridden per-send with `${otpCode} is your RevSlot verification code`
    // (advisorOtpTemplateData()) — this is just the dashboard default.
    subject: "Your RevSlot verification code",
    html: renderEmailShell({
      subtitle: "Advisor Portal Access",
      bodyHtml: `
        <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">Hello,</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
          Enter the verification code below to view and manage your booked slots associated with <strong>{{{ADVISOR_EMAIL}}}</strong>.
        </p>
        ${renderCodeBox("{{{OTP_CODE}}}")}
        <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6; text-align: center;">
          This verification code is valid for 10 minutes. If you did not request this code, please ignore this email.
        </p>
      `,
    }),
    variables: [
      { key: "ADVISOR_EMAIL", type: "string", fallbackValue: "" },
      { key: "OTP_CODE", type: "string", fallbackValue: "000000" },
    ],
  },
  {
    alias: BOOKING_CONFIRMATION_TEMPLATE_ID,
    name: "RevSlot — Booking Confirmation",
    // Overridden per-send (bookingConfirmationTemplateData()) based on recipient role.
    subject: "Booking confirmed",
    html: renderEmailShell({
      subtitle: "Booking Confirmed",
      bodyHtml: `
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi {{{RECIPIENT_NAME}}},</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">{{{ROLE_INTRO}}}</p>
        ${renderInfoCard(`
          <p style="margin: 0 0 4px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">{{{FORMATTED_DATE}}}</p>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND.muted};">{{{FORMATTED_TIME}}}</p>
          <p style="margin: 0; font-size: 13px; color: ${BRAND.muted};">Intern: {{{INTERN_NAME}}}</p>
          {{{PAYMENT_SECTION}}}
        `)}
        {{{MEET_SECTION}}}
        ${renderFooter("{{{REVIEWER_NAME}}}")}
      `,
    }),
    variables: [
      { key: "RECIPIENT_NAME", type: "string" },
      { key: "ROLE_INTRO", type: "string" },
      { key: "FORMATTED_DATE", type: "string" },
      { key: "FORMATTED_TIME", type: "string" },
      { key: "INTERN_NAME", type: "string", fallbackValue: "" },
      { key: "PAYMENT_SECTION", type: "string", fallbackValue: "" },
      { key: "MEET_SECTION", type: "string", fallbackValue: "" },
      { key: "REVIEWER_NAME", type: "string" },
    ],
  },
  {
    alias: BOOKING_CANCELLED_TEMPLATE_ID,
    name: "RevSlot — Booking Cancelled",
    // Overridden per-send: "Booking cancelled: <event type name>"
    subject: "Booking cancelled",
    html: renderEmailShell({
      subtitle: "Booking Cancelled",
      bodyHtml: `
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi {{{RECIPIENT_NAME}}},</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">{{{ROLE_INTRO}}}</p>
        ${renderInfoCard(`
          <p style="margin: 0 0 4px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">{{{FORMATTED_DATE}}}</p>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: ${BRAND.muted};">{{{FORMATTED_TIME}}}</p>
          <p style="margin: 0; font-size: 13px; color: ${BRAND.danger};">Reason: {{{REASON}}}</p>
          {{{REFUND_SECTION}}}
        `)}
        ${renderFooter("{{{REVIEWER_NAME}}}")}
      `,
    }),
    variables: [
      { key: "RECIPIENT_NAME", type: "string" },
      { key: "ROLE_INTRO", type: "string" },
      { key: "FORMATTED_DATE", type: "string" },
      { key: "FORMATTED_TIME", type: "string" },
      { key: "REASON", type: "string", fallbackValue: "" },
      { key: "REFUND_SECTION", type: "string", fallbackValue: "" },
      { key: "REVIEWER_NAME", type: "string" },
    ],
  },
  {
    alias: BOOKING_RESCHEDULED_TEMPLATE_ID,
    name: "RevSlot — Booking Rescheduled",
    // Overridden per-send: "Booking rescheduled: <event type name>"
    subject: "Booking rescheduled",
    html: renderEmailShell({
      subtitle: "Booking Rescheduled",
      bodyHtml: `
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi {{{RECIPIENT_NAME}}},</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">{{{ROLE_INTRO}}}</p>
        <div style="margin: 16px 0; padding: 12px 16px; border: 1px solid ${BRAND.border}; border-radius: 8px; opacity: 0.6;">
          <p style="margin: 0; font-size: 12px; color: ${BRAND.faint}; text-decoration: line-through;">Previously: {{{OLD_FORMATTED_DATE}}}, {{{OLD_FORMATTED_TIME}}}</p>
        </div>
        ${renderInfoCard(
          `<p style="margin: 0 0 4px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600;">New time: {{{NEW_FORMATTED_DATE}}}</p>
           <p style="margin: 0; font-size: 13px; color: ${BRAND.muted};">{{{NEW_FORMATTED_TIME}}}</p>`,
          BRAND.primary
        )}
        {{{MEET_SECTION}}}
        ${renderFooter("{{{REVIEWER_NAME}}}")}
      `,
    }),
    variables: [
      { key: "RECIPIENT_NAME", type: "string" },
      { key: "ROLE_INTRO", type: "string" },
      { key: "OLD_FORMATTED_DATE", type: "string" },
      { key: "OLD_FORMATTED_TIME", type: "string" },
      { key: "NEW_FORMATTED_DATE", type: "string" },
      { key: "NEW_FORMATTED_TIME", type: "string" },
      { key: "MEET_SECTION", type: "string", fallbackValue: "" },
      { key: "REVIEWER_NAME", type: "string" },
    ],
  },
  {
    alias: BOOKING_RESCHEDULE_REQUESTED_TEMPLATE_ID,
    name: "RevSlot — Reschedule Requested",
    // Overridden per-send: "Reschedule Requested: <event type> with <reviewer>"
    subject: "Reschedule requested",
    html: renderEmailShell({
      subtitle: "Reschedule Requested",
      maxWidth: 520,
      bodyHtml: `
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">Hi {{{RECIPIENT_NAME}}},</p>
        <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
          Reviewer <strong>{{{REVIEWER_NAME}}}</strong> has requested to reschedule your <strong>{{{EVENT_TYPE_NAME}}}</strong> session.
        </p>
        {{{REASON_BLOCK}}}
        ${renderInfoCard(`
          <p style="margin: 0 0 8px 0; font-size: 13px; color: ${BRAND.muted};">Current Session Time:</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 500; text-decoration: line-through;">{{{CURRENT_FORMATTED_DATE}}}, {{{CURRENT_FORMATTED_TIME}}}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #0284c7; font-weight: 600;">Proposed New Time:</p>
          <p style="margin: 0; font-size: 16px; color: #0369a1; font-weight: 700;">{{{PROPOSED_FORMATTED_DATE}}}, {{{PROPOSED_FORMATTED_TIME}}}</p>
        `)}
        ${renderPrimaryButton("{{{ACTION_URL}}}", "Respond to Reschedule Request")}
        <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.5;">
          You can accept the proposed time, pick an alternative time that fits your availability, or decline and cancel the session.
        </p>
        ${renderFooter("{{{REVIEWER_NAME}}}")}
      `,
    }),
    variables: [
      { key: "RECIPIENT_NAME", type: "string" },
      { key: "REVIEWER_NAME", type: "string" },
      { key: "EVENT_TYPE_NAME", type: "string" },
      { key: "REASON_BLOCK", type: "string", fallbackValue: "" },
      { key: "CURRENT_FORMATTED_DATE", type: "string" },
      { key: "CURRENT_FORMATTED_TIME", type: "string" },
      { key: "PROPOSED_FORMATTED_DATE", type: "string" },
      { key: "PROPOSED_FORMATTED_TIME", type: "string" },
      { key: "ACTION_URL", type: "string" },
    ],
  },
];

async function upsertTemplate(def: TemplateDef) {
  const existing = await resend.templates.get(def.alias);

  if (!existing.error && existing.data) {
    const updateResult = await resend.templates.update(def.alias, {
      name: def.name,
      subject: def.subject,
      html: def.html,
      variables: def.variables.map((v) => ({ key: v.key, type: v.type, fallbackValue: v.fallbackValue ?? null } as any)),
    });

    if (updateResult.error) {
      console.error(`✗ Failed to update "${def.alias}":`, updateResult.error.message);
      return;
    }

    const publishResult = await resend.templates.publish(def.alias);
    if (publishResult.error) {
      console.error(`✗ Updated but failed to publish "${def.alias}":`, publishResult.error.message);
      return;
    }

    console.log(`✓ Updated + published: ${def.alias}`);
    return;
  }

  const createResult = await resend.templates
    .create({
      name: def.name,
      alias: def.alias,
      subject: def.subject,
      html: def.html,
      variables: def.variables.map((v) => ({ key: v.key, type: v.type, fallbackValue: v.fallbackValue ?? null } as any)),
    })
    .publish();

  if (createResult.error) {
    console.error(`✗ Failed to create "${def.alias}":`, createResult.error.message);
    return;
  }

  console.log(`✓ Created + published: ${def.alias} (id: ${createResult.data?.id})`);
}

async function main() {
  console.log(`Provisioning ${templates.length} RevSlot templates on Resend...\n`);

  for (const def of templates) {
    await upsertTemplate(def);
  }

  console.log("\nDone. Check https://resend.com/templates to review them.");
}

main().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});