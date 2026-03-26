import { Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service.js";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ValidationError } from "../utils/error";

export const notificationController = {
  async getNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const page = Math.max(1, parseInt(String(req.query["page"] ?? 1), 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query["limit"] ?? 20), 10)),
      );

      const result = await notificationService.getNotifications(
        user.id,
        user.role,
        page,
        limit,
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params as { id: string };

      if (!id) throw new ValidationError("Notification ID is required");

      const notification = await notificationService.markAsRead(
        id,
        user.id,
        user.role,
      );
      res
        .status(200)
        .json({ message: "Notification marked as read", notification });
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const count = await notificationService.getUnreadCount(user.id);
      res.status(200).json({ unreadCount: count });
    } catch (err) {
      next(err);
    }
  },
};
