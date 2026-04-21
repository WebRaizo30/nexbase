import { Resend } from "resend";

let resendClient: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

const appName = process.env.APP_PUBLIC_NAME ?? "NexBase";

/**
 * Fire-and-forget welcome email after registration. Swallows errors (logged).
 */
export function sendWelcomeEmail(params: { to: string; name: string | null }): void {
  if (!isResendConfigured()) {
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL!.trim();
  const subject = `Welcome to ${appName}`;
  const display = params.name?.trim() || "there";
  const html = `
    <div style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#0c1810">
      <h1 style="font-size:1.25rem">Welcome, ${escapeHtml(display)}</h1>
      <p>Your account is ready. You can sign in and open the dashboard any time.</p>
      <p style="font-size:0.875rem;color:#555">This message was sent by ${escapeHtml(appName)}.</p>
    </div>
  `;

  void (async () => {
    try {
      const resend = getResend();
      const { error } = await resend.emails.send({
        from,
        to: params.to,
        subject,
        html,
      });
      if (error) {
        console.error("Resend welcome email failed", error);
      }
    } catch (e) {
      console.error("Resend welcome email error", e);
    }
  })();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
