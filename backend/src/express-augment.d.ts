declare global {
  namespace Express {
    interface Request {
      /** Set by JWT auth middleware when Authorization Bearer token is valid */
      userId?: string;
    }
  }
}

export {};
