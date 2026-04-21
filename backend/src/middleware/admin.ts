import type { NextFunction, Request, Response } from "express";
import type { AuthedRequest } from "../lib/auth-request.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "./auth.js";

/**
 * Requires JWT and User.role === "admin".
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    void (async () => {
      const userId = (req as AuthedRequest).userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      next();
    })();
  });
}
