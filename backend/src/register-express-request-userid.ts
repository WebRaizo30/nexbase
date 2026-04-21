/**
 * Side-effect module: augments Express Request for JWT `userId`.
 * Imported first from `index.ts` so Vercel's typecheck includes this graph.
 */
import "express";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by JWT auth middleware when Authorization Bearer token is valid */
    userId?: string;
  }
}
