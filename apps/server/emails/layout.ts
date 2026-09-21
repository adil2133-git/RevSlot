/**
 * Shared RevSlot email branding — used by both the fallback HTML builders
 * in emails/templates/*.ts AND the Resend template skeletons in
 * scripts/provisionResendTemplates.ts, so every email (auth OTPs, booking
 * confirmations, cancellations, reschedules) looks visually consistent.
 *
 * These functions just assemble plain HTML strings — they don't know or
 * care whether the content passed in is a real value or a literal
 * "{{{VARIABLE}}}" placeholder, so the same building blocks work for both
 * the rendered fallback email and the Resend template source.
 */

export const BRAND = {
  primary: "#003366",
  primaryLight: "#e6eef5",
  text: "#1e293b",
  bodyText: "#334155",
  muted: "#64748b",
  faint: "#9ca3af",
  border: "#e2e8f0",
  danger: "#ba1a1a",
  warnBg: "#fef3c7",
  warnBorder: "#f59e0b",
  warnText: "#92400e",
  fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
};

interface ShellOptions {
  subtitle: string;
  bodyHtml: string;
  maxWidth?: number;
}

// The branded outer card every RevSlot email sits inside: logo + subtitle
// up top, rounded card with a thin border, Outfit font family.
export function renderEmailShell({ subtitle, bodyHtml, maxWidth = 480 }: ShellOptions): string {
  return `
    <div style="font-family: ${BRAND.fontFamily}; max-width: ${maxWidth}px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid ${BRAND.border};">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: ${BRAND.primary}; margin: 0; font-size: 24px; font-weight: 700;">RevSlot</h2>
        <p style="color: ${BRAND.muted}; font-size: 14px; margin-top: 4px;">${subtitle}</p>
      </div>
      ${bodyHtml}
    </div>
  `;
}

// The large, letter-spaced OTP/code box (used by verify-email, forgot
// password, advisor OTP).
export function renderCodeBox(codeHtml: string): string {
  return `
    <div style="margin: 28px 0; padding: 18px; background: ${BRAND.primaryLight}; border-radius: 12px; text-align: center;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${BRAND.primary};">${codeHtml}</span>
    </div>
  `;
}

// A bordered info card (booking date/time details, etc.)
export function renderInfoCard(innerHtml: string, borderColor: string = BRAND.border): string {
  return `<div style="margin: 20px 0; padding: 16px 20px; border: 1px solid ${borderColor}; border-radius: 8px;">${innerHtml}</div>`;
}

// A brand-colored call-to-action button.
export function renderPrimaryButton(hrefHtml: string, label: string): string {
  return `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${hrefHtml}" style="display: inline-block; padding: 12px 24px; background: ${BRAND.primary}; color: #ffffff; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none;">${label}</a>
    </div>
  `;
}

// Small "Sent by RevSlot on behalf of X" line at the bottom.
export function renderFooter(nameHtml: string): string {
  return `<p style="color: ${BRAND.faint}; font-size: 12px; line-height: 1.6; margin-top: 24px; text-align: center;">Sent by RevSlot on behalf of ${nameHtml}.</p>`;
}