/**
 * Product configuration — adjust branding, plans, and feature flags for your SaaS.
 * Price IDs here are placeholders; real Stripe Price IDs live in backend/.env (STRIPE_PRICE_*).
 */
export const nexbaseConfig = {
  appName: "NexBase",
  appDescription: "A customizable, production-ready SaaS starter kit.",
  social: {
    x: "https://x.com/WebRaizo",
    github: "https://github.com/webraizo30",
  },
  plans: [
    {
      name: "Starter",
      price: 9,
      priceId: "price_starter",
      features: ["10 projects", "Basic analytics"],
    },
    {
      name: "Pro",
      price: 29,
      priceId: "price_pro",
      features: ["Unlimited projects", "Advanced analytics", "API access"],
    },
    {
      name: "Enterprise",
      price: 79,
      priceId: "price_enterprise",
      features: ["Everything in Pro", "Custom integrations", "Priority support"],
    },
  ],
  features: {
    fileUpload: true,
    teamSupport: false,
    apiAccess: true,
  },
} as const;

export type NexbaseConfig = typeof nexbaseConfig;
