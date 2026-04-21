import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthedRequest } from "../lib/auth-request.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies JWT from Authorization: Bearer <token> and attaches userId to the request.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    res.status(500).json({ error: "Server misconfiguration: JWT_SECRET is not set" });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    const userId = payload.sub;
    if (!userId || typeof userId !== "string") {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }
    (req as AuthedRequest).userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
