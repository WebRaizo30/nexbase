import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Returns a singleton Stripe client. Requires STRIPE_SECRET_KEY.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
