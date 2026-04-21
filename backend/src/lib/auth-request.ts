import type { Request } from "express";

/** Request after `requireAuth` attaches the JWT subject. */
export type AuthedRequest = Request & { userId: string };
