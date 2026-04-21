import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { AuthedRequest } from "../lib/auth-request.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const usersRouter = Router();

const updateProfileBody = z
  .object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email().optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "currentPassword is required when newPassword is set",
        path: ["currentPassword"],
      });
    }
  });

const deleteAccountBody = z.object({
  password: z.string().min(1),
});

usersRouter.get("/profile", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

usersRouter.put("/profile", requireAuth, async (req, res) => {
  const parsed = updateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  const userId = (req as AuthedRequest).userId;
  const { name, email, currentPassword, newPassword } = parsed.data;

  if (name === undefined && email === undefined && newPassword === undefined) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (newPassword) {
    const ok = await bcrypt.compare(currentPassword!, existing.password);
    if (!ok) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
  }

  if (email && email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      res.status(409).json({ error: "Email is already in use" });
      return;
    }
  }

  const data: { name?: string | null; email?: string; password?: string } = {};
  if (name !== undefined) {
    data.name = name;
  }
  if (email !== undefined) {
    data.email = email;
  }
  if (newPassword) {
    data.password = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  res.json({ user });
});

/**
 * Permanently removes the user and related rows (cascade in Prisma schema).
 */
usersRouter.delete("/account", requireAuth, async (req, res) => {
  const parsed = deleteAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  const userId = (req as AuthedRequest).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    res.status(401).json({ error: "Password is incorrect" });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
});

export { usersRouter };
