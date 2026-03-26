import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requirePermissions } from "../rbac/rbac.middleware";

const router = Router();

// All notification routes require auth
router.use(authMiddleware);

// GET /api/notifications
router.get(
  "/",
  requirePermissions("notification:read"),
  notificationController.getNotifications,
);

// GET /api/notifications/unread-count
router.get(
  "/unread-count",
  requirePermissions("notification:read"),
  notificationController.getUnreadCount,
);

// PATCH /api/notifications/:id/read
router.patch(
  "/:id/read",
  requirePermissions("notification:read"),
  notificationController.markAsRead,
);

export default router;
