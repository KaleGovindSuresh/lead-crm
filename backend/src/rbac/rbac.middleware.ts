import { Response, NextFunction } from 'express';
import { rolePermissions, Permission } from './permissions';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const requirePermissions = (...required: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const permissions = rolePermissions[user.role] ?? [];
    const hasAll = required.every((perm) => permissions.includes(perm));

    if (!hasAll) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
};