import { Server as SocketServer } from "socket.io";
import {
  NotificationModel,
  NotificationType,
} from "../models/notification.model";
import { UserModel } from "../models/user.model";
import { NotFoundError, ForbiddenError } from "../utils/error";
import { logger } from "../utils/logger";

let ioInstance: SocketServer | null = null;

export function setSocketIO(io: SocketServer): void {
  ioInstance = io;
}

export interface CreateNotificationInput {
  userIds: string[];
  type: NotificationType;
  message: string;
  leadId?: string;
}

export const notificationService = {
  async createAndDispatch(input: CreateNotificationInput) {
    const { userIds, type, message, leadId } = input;

    if (userIds.length === 0) return;

    const docs = await NotificationModel.insertMany(
      userIds.map((userId) => ({
        user: userId,
        type,
        message,
        lead: leadId ?? null,
      })),
    );

    if (ioInstance) {
      docs.forEach((doc) => {
        const room = `user:${doc.user.toString()}`;
        ioInstance!.to(room).emit("notification", {
          _id: doc._id,
          user: doc.user,
          type: doc.type,
          message: doc.message,
          lead: doc.lead,
          read: doc.read,
          createdAt: doc.createdAt,
        });
      });
    } else {
      logger.warn(
        "Socket.IO not initialized — notifications not dispatched in real-time",
      );
    }

    return docs;
  },

  async notifyManagersAndAdmins(
    type: NotificationType,
    message: string,
    leadId?: string,
    excludeUserId?: string,
  ) {
    const recipients = await UserModel.find({
      role: { $in: ["admin", "manager"] },
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    }).select("_id");

    const userIds = recipients.map((u) => u._id.toString());
    if (userIds.length === 0) return;

    await notificationService.createAndDispatch({
      userIds,
      type,
      message,
      leadId,
    });
  },

  async getNotifications(
    userId: string,
    role: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    // sales can only see their own; admin/manager also see their own (own mailbox)
    const filter = { user: userId };

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("lead", "name status")
        .lean(),
      NotificationModel.countDocuments(filter),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async markAsRead(notificationId: string, userId: string, role: string) {
    const notification = await NotificationModel.findById(notificationId);

    if (!notification) throw new NotFoundError("Notification");

    // Only owner or admin can mark as read
    if (notification.user.toString() !== userId && role !== "admin") {
      throw new ForbiddenError("You do not have access to this notification");
    }

    notification.read = true;
    await notification.save();

    return notification;
  },

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ user: userId, read: false });
  },
};
