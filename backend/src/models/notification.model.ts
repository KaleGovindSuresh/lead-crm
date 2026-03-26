import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'lead_created'
  | 'lead_assigned'
  | 'lead_reassigned'
  | 'lead_status_changed'
  | 'lead_deleted';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  message: string;
  lead?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: [
        'lead_created',
        'lead_assigned',
        'lead_reassigned',
        'lead_status_changed',
        'lead_deleted',
      ],
      required: [true, 'Type is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for notification list queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);