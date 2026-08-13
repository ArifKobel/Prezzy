import type { NextFunction, Request, Response } from "express";

export const publicOAuthOrigin = (origin: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const publicUrl = new URL(origin);
    req.headers["x-forwarded-host"] = publicUrl.host;
    req.headers["x-forwarded-proto"] = publicUrl.protocol.slice(0, -1);
    next();
  };
