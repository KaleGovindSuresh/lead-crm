import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { UserRole } from '../models/user.model';

export const userController = {
  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({ users });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { role } = req.body as { role: UserRole };
      const user = await userService.updateRole(id, role);
      res.status(200).json({ message: 'Role updated successfully', user });
    } catch (err) {
      next(err);
    }
  },
};