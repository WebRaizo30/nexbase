import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import type { AuthedRequest } from "../lib/auth-request.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { sendWelcomeEmail } from "../services/email.js";

const router = Router();

function resolveRoleForNewUser(email: string): string {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const admins = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return admins.has(email.toLowerCase()) ? "admin" : "user";
}

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId }, secret, signOptions);
}

router.post("/register", async (req, res) => {
  try {
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const role = resolveRoleForNewUser(email);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name ?? null, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    sendWelcomeEmail({ to: user.email, name: user.name });

    let token: string;
    try {
      token = signToken(user.id);
    } catch {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }

    res.status(201).json({ user, token });
  } catch (e) {
    console.error("POST /api/auth/register", e);
    if (!res.headersSent) {
      res.status(500).json({
        error:
          "Registration failed. Ensure the database schema is applied (run `npx prisma db push` against this DATABASE_URL).",
      });
    }
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    let token: string;
    try {
      token = signToken(user.id);
    } catch {
      res.status(500).json({ error: "Server misconfiguration" });
      return;
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    console.error("POST /api/auth/login", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Login failed" });
    }
  }
});

/**
 * Stateless JWT: client discards the token. Kept for API symmetry with the product spec.
 */
router.post("/logout", (_req, res) => {
  res.status(204).send();
});

router.get("/me", requireAuth, async (req, res) => {
  try {
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
  } catch (e) {
    console.error("GET /api/auth/me", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to load user" });
    }
  }
});

export { router as authRouter };
