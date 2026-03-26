import { Request } from "express";

export interface AuthUser {
  id: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
