import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "./auth.js";

/**
 * Requires JWT and User.role === "admin".
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    void (async () => {
      const userId = req.userId!;
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
