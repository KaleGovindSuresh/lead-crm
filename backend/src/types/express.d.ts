import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any; // replace with your actual User type if you have one
}