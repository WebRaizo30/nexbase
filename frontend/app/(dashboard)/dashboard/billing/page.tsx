"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, ApiError } from "@/lib/api";
import { nexbaseConfig } from "@/lib/nexbase-config";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
} | null;

type SetupBody = {
  code?: string;
  setupSteps?: string[];
  message?: string;
};

function planSlugFromName(name: string): "starter" | "pro" | "enterprise" {
  const n = name.toLowerCase();
  if (n.includes("enterprise")) return "enterprise";
  if (n.includes("pro")) return "pro";
  return "starter";
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupBody | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setSetup(null);
    setLoading(true);
    try {
      const data = await apiJson<{ subscription: Subscription }>("/api/billing/subscription");
      setSubscription(data.subscription);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to load subscription");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function checkout(plan: "starter" | "pro" | "enterprise") {
    setError(null);
    setSetup(null);
    setActionLoading(`checkout-${plan}`);
    try {
      const data = await apiJson<{ url: string }>("/api/billing/create-checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      window.location.href = data.url;
    } catch (e) {
      if (e instanceof ApiError && e.status === 503 && e.body && typeof e.body === "object") {
        setSetup(e.body as SetupBody);
        setError(null);
      } else if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Checkout failed");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function openPortal() {
    setError(null);
    setSetup(null);
    setActionLoading("portal");
    try {
      const data = await apiJson<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.href = data.url;
    } catch (e) {
      if (e instanceof ApiError && e.status === 503 && e.body && typeof e.body === "object") {
        setSetup(e.body as SetupBody);
        setError(null);
      } else if (e instanceof ApiError) {
        setError(
          typeof e.body === "object" && e.body && "error" in e.body
            ? String((e.body as { error: string }).error)
            : e.message,
        );
      } else {
        setError("Portal failed");
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="crt-badge mb-3">LEDGER</p>
        <h1 className="crt-title text-3xl">Billing</h1>
        <p className="crt-subtitle mt-3 text-sm">
          Stripe is optional. When the API is not configured, you get in-app setup steps instead of a dead end.
        </p>
      </div>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crt-muted">Loading…</p>
      ) : null}

      {!loading && subscription ? (
        <div className="crt-panel crt-panel-glow p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-phosphor-bright">
            Current plan
          </h2>
          <p className="mt-3 font-mono text-sm capitalize text-foreground">
            {subscription.plan}{" "}
            <span className="text-crt-muted">— {subscription.status}</span>
          </p>
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-wider text-crt-muted">
            Period end · {new Date(subscription.currentPeriodEnd).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={actionLoading !== null}
            className="crt-btn-ghost mt-5 disabled:opacity-50"
          >
            {actionLoading === "portal" ? "Opening…" : "Manage billing"}
          </button>
        </div>
      ) : null}

      {!loading && !subscription ? (
        <div className="crt-panel p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-phosphor-bright">
            Choose a plan
          </h2>
          <p className="crt-subtitle mt-3 text-sm">
            Checkout opens in Stripe when keys and price IDs are present on the API.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {nexbaseConfig.plans.map((p) => {
              const slug = planSlugFromName(p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() => void checkout(slug)}
                  className="crt-btn-primary disabled:opacity-50"
                >
                  {actionLoading === `checkout-${slug}` ? "Redirecting…" : `Upgrade — ${p.name}`}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p className="crt-alert crt-alert-bad rounded-sm p-3 font-mono text-xs">{error}</p> : null}

      {setup?.setupSteps?.length ? (
        <div className="crt-alert rounded-sm p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-phosphor-bright">
            {setup.message ?? "Enable Stripe to use checkout and the customer portal."}
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 font-mono text-xs leading-relaxed text-foreground">
            {setup.setupSteps.map((step) => (
              <li key={step} className="normal-case tracking-normal">
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
