import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

type ClearCall = { name: string; domain?: string };

const responseStub = () => {
  const cleared: ClearCall[] = [];
  const set: ClearCall[] = [];
  const res = {
    cookie: (name: string, _value: string, options: { domain?: string }) => {
      set.push({ name, domain: options.domain });
    },
    clearCookie: (name: string, options: { domain?: string }) => {
      cleared.push({ name, domain: options.domain });
    },
  } as unknown as Response;
  return { res, cleared, set };
};

const loadWith = async (cookieDomain: string | undefined) => {
  vi.resetModules();
  if (cookieDomain) process.env.COOKIE_DOMAIN = cookieDomain;
  else delete process.env.COOKIE_DOMAIN;
  return import("@/auth/session-cookie");
};

describe("session cookie", () => {
  beforeEach(() => {
    delete process.env.COOKIE_DOMAIN;
  });

  it("clears both the scoped and the legacy host-only cookie when a domain is configured", async () => {
    const { clearSessionCookie } = await loadWith("prezzy.kobel.click");
    const { res, cleared } = responseStub();

    clearSessionCookie(res);

    expect(cleared.map((c) => c.domain)).toEqual([undefined, "prezzy.kobel.click"]);
  });

  it("drops the legacy host-only cookie when issuing a new session", async () => {
    const { setSessionCookie } = await loadWith("prezzy.kobel.click");
    const { res, cleared, set } = responseStub();

    setSessionCookie(res, "token");

    expect(cleared).toEqual([{ name: "prezzy_session", domain: undefined }]);
    expect(set).toEqual([{ name: "prezzy_session", domain: "prezzy.kobel.click" }]);
  });

  it("stays single-cookie in local setups without a cookie domain", async () => {
    const { clearSessionCookie, setSessionCookie } = await loadWith(undefined);
    const { res, cleared, set } = responseStub();

    setSessionCookie(res, "token");
    clearSessionCookie(res);

    expect(cleared).toEqual([{ name: "prezzy_session", domain: undefined }]);
    expect(set).toEqual([{ name: "prezzy_session", domain: undefined }]);
  });
});
