import type { CookieOptions, Response } from "express";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/auth/auth.constants";
import { env } from "@/config/env";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.publicUrl.startsWith("https"),
  path: "/",
};

export const setSessionCookie = (res: Response, token: string): void => {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
};

export const clearSessionCookie = (res: Response): void => {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
};
