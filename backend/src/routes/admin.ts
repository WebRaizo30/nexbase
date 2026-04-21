import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

const adminRouter = Router();

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  const [users, subscriptions, apiKeys, files, analyticsDays] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count(),
    prisma.apiKey.count(),
    prisma.file.count(),
    prisma.analyticsDaily.count(),
  ]);
  res.json({
    counts: { users, subscriptions, apiKeys, files, analyticsDays },
    demo: true,
  });
});

const listQuery = z.object({
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});

adminRouter.get("/users", requireAdmin, async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }
  const skip = parsed.data.skip ?? 0;
  const take = parsed.data.take ?? 25;

  const [total, rows] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { apiKeys: true, files: true } },
      },
    }),
  ]);

  res.json({
    total,
    skip,
    take,
    users: rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      apiKeyCount: u._count.apiKeys,
      fileCount: u._count.files,
    })),
  });
});

export { adminRouter };
