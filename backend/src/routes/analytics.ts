import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const analyticsRouter = Router();

/**
 * Demo time-series for charts (seeded). Any authenticated user can read.
 */
analyticsRouter.get("/overview", requireAuth, async (_req, res) => {
  const rows = await prisma.analyticsDaily.findMany({
    orderBy: { date: "asc" },
    take: 90,
  });
  const series = rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    signups: r.signups,
    activeUsers: r.activeUsers,
    apiCalls: r.apiCalls,
    revenueCents: r.revenueCents,
  }));
  res.json({ series, demo: true });
});

export { analyticsRouter };
