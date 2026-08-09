import { env } from "@Prezzy/env/web";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getSocketId } from "@/lib/api/socket";

const requestCookieHeader = createIsomorphicFn()
  .client((): string | undefined => undefined)
  .server(() => getRequestHeader("cookie"));

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; nullOn404?: boolean } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const socketId = getSocketId();
    if (socketId) headers["x-socket-id"] = socketId;
  }
  const cookie = requestCookieHeader();
  if (cookie) headers["cookie"] = cookie;
  const res = await fetch(`${env.VITE_API_URL}/api${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 404 && options.nullOn404) return null as T;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {}
    throw new ApiError(res.status, message || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${env.VITE_API_URL}/api${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.json();
}
