import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

const storage = new AsyncLocalStorage<string>();

export const SOCKET_ID_HEADER = "x-socket-id";

export const socketIdContext = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers[SOCKET_ID_HEADER];
  const socketId = Array.isArray(header) ? header[0] : header;
  if (!socketId) {
    next();
    return;
  }
  storage.run(socketId, next);
};

export const currentSocketId = (): string | undefined => storage.getStore();
