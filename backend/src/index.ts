import "dotenv/config";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { billingRouter, stripeWebhookHandler } from "./routes/billing.js";
import { apiKeysRouter } from "./routes/api-keys.js";
import { adminRouter } from "./routes/admin.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { analyticsRouter } from "./routes/analytics.js";
import { filesRouter } from "./routes/files.js";
import { usersRouter } from "./routes/users.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

// Stripe needs the raw body for signature verification — register before express.json()
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    void stripeWebhookHandler(req, res).catch(next);
  },
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/** DB connectivity (Prisma). /health does not touch the database. */
app.get("/health/db", async (_req, res) => {
  const ms = Number(process.env.HEALTH_DB_TIMEOUT_MS) || 8_000;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({
      ok: false,
      db: false,
      hint:
        "PostgreSQL unreachable from this host. On Vercel + Supabase use the Transaction pooler URI (port 6543) with ?pgbouncer=true&connection_limit=1, not only the direct :5432 URL.",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/billing", billingRouter);
app.use("/api/users", usersRouter);
app.use("/api/api-keys", apiKeysRouter);
app.use("/api/files", filesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
