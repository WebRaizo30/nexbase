import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const dashboardRouter = Router();

/**
 * Single payload for the dashboard home: user snapshot, counts, subscription, latest demo metric row.
 */
dashboardRouter.get("/summary", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const [user, apiKeys, files, subscription, pulse] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true },
    }),
    prisma.apiKey.count({ where: { userId } }),
    prisma.file.count({ where: { userId } }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, currentPeriodEnd: true },
    }),
    prisma.analyticsDaily.findFirst({
      orderBy: { date: "desc" },
      select: {
        date: true,
        signups: true,
        activeUsers: true,
        apiCalls: true,
        revenueCents: true,
      },
    }),
  ]);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    user,
    counts: { apiKeys, files },
    subscription,
    pulse: pulse
      ? {
          date: pulse.date.toISOString().slice(0, 10),
          signups: pulse.signups,
          activeUsers: pulse.activeUsers,
          apiCalls: pulse.apiCalls,
          revenueCents: pulse.revenueCents,
        }
      : null,
  });
});

export { dashboardRouter };
