import type { Request } from "express";
import type { User } from "../shared";

export interface AuthenticatedRequest extends Request {
  user?: User;
}
