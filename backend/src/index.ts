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
