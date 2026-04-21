import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../lib/auth-request.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const apiKeysRouter = Router();

const createBody = z.object({
  name: z.string().min(1).max(80).trim(),
});

/** Opaque key; full value is returned only once on create. */
function generateApiKey(): string {
  const raw = randomBytes(24).toString("base64url");
  return `nbk_${raw}`;
}

/** Redacts stored key for list responses (never show full secret after creation). */
function maskKey(key: string): string {
  if (key.length <= 10) {
    return "••••";
  }
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

apiKeysRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  const userId = (req as AuthedRequest).userId;
  const key = generateApiKey();

  try {
    const row = await prisma.apiKey.create({
      data: {
        userId,
        key,
        name: parsed.data.name,
      },
      select: { id: true, name: true, key: true, createdAt: true },
    });
    res.status(201).json({
      apiKey: row,
      message: "Store this key securely; it will not be shown again in full.",
    });
  } catch (e) {
    console.error("apiKey create failed", e);
    res.status(500).json({ error: "Failed to create API key" });
  }
});

apiKeysRouter.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const rows = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, key: true, createdAt: true, lastUsed: true },
  });
  const apiKeys = rows.map((r) => ({
    id: r.id,
    name: r.name,
    keyPreview: maskKey(r.key),
    createdAt: r.createdAt,
    lastUsed: r.lastUsed,
  }));
  res.json({ apiKeys });
});

apiKeysRouter.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = req.params.id?.trim();
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const existing = await prisma.apiKey.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: "API key not found" });
    return;
  }

  await prisma.apiKey.delete({ where: { id } });
  res.status(204).send();
});

export { apiKeysRouter };
