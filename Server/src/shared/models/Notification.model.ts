import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  priority?: "low" | "normal" | "high";
  channels?: string[];
  createdAt: Date;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    data: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    channels: [String],
    createdAt: { type: Date, default: () => new Date(), index: -1 },
    expiresAt: Date,
  },
  { collection: "notifications" }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
