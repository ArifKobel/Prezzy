import type { CookieOptions, Response } from "express";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/auth/auth.constants";
import { env } from "@/config/env";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.publicUrl.startsWith("https"),
  domain: env.cookieDomain,
  path: "/",
};

const clearHostOnlyCookie = (res: Response): void => {
  if (!env.cookieDomain) return;
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, domain: undefined });
};

export const setSessionCookie = (res: Response, token: string): void => {
  clearHostOnlyCookie(res);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
};

export const clearSessionCookie = (res: Response): void => {
  clearHostOnlyCookie(res);
  res.clearCookie(SESSION_COOKIE, cookieOptions);
};
