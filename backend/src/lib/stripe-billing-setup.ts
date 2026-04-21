import type { Response } from "express";

/**
 * Human-readable steps shown when billing is used without Stripe configured.
 * (API JSON is English; frontend can surface this to the user.)
 */
export const STRIPE_BILLING_SETUP_STEPS: readonly string[] = [
  "Create a free Stripe account — test mode is enough for local development.",
  "In Stripe Dashboard → Products, create recurring prices for your plans (starter, pro, enterprise).",
  "Copy your secret key (sk_test_...) into STRIPE_SECRET_KEY in backend/.env.",
  "Copy each Price ID into STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, and STRIPE_PRICE_ENTERPRISE.",
  "Set FRONTEND_URL to your app origin (e.g. http://localhost:3000) so Checkout and Billing Portal return URLs work.",
  "For webhooks locally: install Stripe CLI, run `stripe listen --forward-to localhost:4000/api/billing/webhook`, and set STRIPE_WEBHOOK_SECRET to the whsec_ value from that command (or use a Dashboard webhook endpoint in production).",
  "Optional for the browser: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...) on the frontend when you build the UI.",
];

export function respondBillingStripeNotConfigured(res: Response): void {
  res.status(503).json({
    error: "Billing is not enabled",
    code: "STRIPE_NOT_CONFIGURED",
    message:
      "Subscriptions and checkout require Stripe. The rest of the API (auth, database, etc.) works without it. When you want billing, follow setupSteps.",
    setupSteps: [...STRIPE_BILLING_SETUP_STEPS],
  });
}

export function respondStripePriceNotConfigured(
  res: Response,
  plan: string,
): void {
  res.status(503).json({
    error: "Stripe price ID missing for this plan",
    code: "STRIPE_PRICE_NOT_CONFIGURED",
    message: `Set the price env var for plan "${plan}" (see backend/.env.example).`,
    setupSteps: [
      `In Stripe Dashboard, copy the Price ID for the "${plan}" plan and set STRIPE_PRICE_${plan.toUpperCase()} in backend/.env (see .env.example for exact variable names).`,
      ...STRIPE_BILLING_SETUP_STEPS.slice(2),
    ],
  });
}

/**
 * Webhook: return 200 so Stripe does not retry forever when the app is intentionally without secrets.
 */
export function respondStripeWebhookSkipped(res: Response, reason: "secret" | "stripe_key"): void {
  res.status(200).json({
    received: true,
    skipped: true,
    code: reason === "secret" ? "STRIPE_WEBHOOK_SECRET_MISSING" : "STRIPE_SECRET_KEY_MISSING",
    message:
      reason === "secret"
        ? "Webhook signing secret is not set; event was not verified. Add STRIPE_WEBHOOK_SECRET when you enable Stripe."
        : "Stripe secret key is not set; webhook ignored. Add STRIPE_SECRET_KEY when you enable Stripe.",
    setupSteps: [...STRIPE_BILLING_SETUP_STEPS],
  });
}
