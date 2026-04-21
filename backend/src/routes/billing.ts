import { Router } from "express";
import type { Request, Response } from "express";
import type Stripe from "stripe";
import { z } from "zod";
import type { AuthedRequest } from "../lib/auth-request.js";
import { prisma } from "../lib/prisma.js";
import {
  respondBillingStripeNotConfigured,
  respondStripePriceNotConfigured,
  respondStripeWebhookSkipped,
} from "../lib/stripe-billing-setup.js";
import { requireAuth } from "../middleware/auth.js";
import { getStripe } from "../services/stripe.js";

const billingRouter = Router();

const checkoutBody = z.object({
  plan: z.enum(["starter", "pro", "enterprise"]),
});

function frontendBaseUrl(): string {
  return process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function priceIdForPlan(plan: z.infer<typeof checkoutBody>["plan"]): string | undefined {
  const map = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  } as const;
  return map[plan];
}

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): string {
  if (status === "canceled") return "canceled";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "active" || status === "trialing") return "active";
  return status;
}

async function upsertSubscriptionFromStripe(params: {
  userId: string;
  customerId: string;
  subscriptionId: string;
  plan: string;
  subscription: Stripe.Subscription;
}): Promise<void> {
  const { userId, customerId, subscriptionId, plan, subscription } = params;
  const status = normalizeSubscriptionStatus(subscription.status);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      plan,
      status,
      currentPeriodEnd,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      plan,
      status,
      currentPeriodEnd,
    },
  });
}

billingRouter.post("/create-checkout", requireAuth, async (req, res) => {
  const parsed = checkoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  const userId = (req as AuthedRequest).userId;

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    respondBillingStripeNotConfigured(res);
    return;
  }

  const priceId = priceIdForPlan(parsed.data.plan);
  if (!priceId?.trim()) {
    respondStripePriceNotConfigured(res, parsed.data.plan);
    return;
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    respondBillingStripeNotConfigured(res);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const base = frontendBaseUrl().replace(/\/$/, "");
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/billing?checkout=success`,
    cancel_url: `${base}/pricing?checkout=canceled`,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan: parsed.data.plan },
    subscription_data: {
      metadata: { userId: user.id, plan: parsed.data.plan },
    },
  };

  if (user.subscription?.stripeCustomerId) {
    sessionParams.customer = user.subscription.stripeCustomerId;
  } else {
    sessionParams.customer_email = user.email;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      res.status(500).json({ error: "Checkout session missing redirect URL" });
      return;
    }
    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout.sessions.create failed", e);
    res.status(502).json({ error: "Failed to create checkout session" });
  }
});

billingRouter.post("/portal", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    respondBillingStripeNotConfigured(res);
    return;
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    respondBillingStripeNotConfigured(res);
    return;
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) {
    res.status(400).json({ error: "No billing customer on file" });
    return;
  }

  const base = frontendBaseUrl().replace(/\/$/, "");
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${base}/dashboard/billing`,
    });
    res.json({ url: portal.url });
  } catch (e) {
    console.error("Stripe billingPortal.sessions.create failed", e);
    res.status(502).json({ error: "Failed to create billing portal session" });
  }
});

billingRouter.get("/subscription", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  res.json({ subscription });
});

/**
 * Stripe webhook. Must receive raw body (registered before express.json in index).
 */
async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    respondStripeWebhookSkipped(res, "stripe_key");
    return;
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    respondStripeWebhookSkipped(res, "secret");
    return;
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    respondStripeWebhookSkipped(res, "stripe_key");
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    res.status(400).send("Missing stripe-signature");
    return;
  }

  let event: Stripe.Event;
  try {
    const raw = req.body;
    if (!Buffer.isBuffer(raw)) {
      res.status(400).send("Expected raw body");
      return;
    }
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    res.status(400).send("Invalid signature");
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
        const plan = session.metadata?.plan ?? "starter";
        if (!userId) {
          console.error("checkout.session.completed: missing userId");
          break;
        }

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!customerId || !subscriptionId) {
          console.error("checkout.session.completed: missing customer or subscription id");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriptionFromStripe({
          userId,
          customerId,
          subscriptionId,
          plan,
          subscription,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
        });
        if (!existing) break;

        const plan = sub.metadata?.plan ?? existing.plan;
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan,
            status: normalizeSubscriptionStatus(sub.status),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: "canceled" },
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subId) break;
        await prisma.subscription.updateMany({
          where: { stripeSubId: subId },
          data: { status: "past_due" },
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error", e);
    res.status(500).json({ error: "Webhook handler failed" });
    return;
  }

  res.json({ received: true });
}

export { billingRouter, stripeWebhookHandler };
