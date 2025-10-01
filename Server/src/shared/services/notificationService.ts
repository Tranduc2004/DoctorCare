import { NotificationModel, INotification } from "../models/Notification.model";
import { Types } from "mongoose";
import { getIO } from "../../utils/socket";
import { sendMail } from "../utils";

export async function createNotification(
  payload: Partial<INotification> & {
    userId: Types.ObjectId | string;
    type: string;
    title: string;
  }
) {
  const doc = await NotificationModel.create({
    ...payload,
    userId: payload.userId,
  });
  // Emit via socket if available
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${String(payload.userId)}`).emit("notification:new", doc);
    }
  } catch (err) {
    console.error("Emit notification error:", err);
  }
  // Optionally send email if requested (best-effort, non-blocking)
  try {
    const wantsEmail =
      Array.isArray(doc.channels) && doc.channels.includes("email");
    const emailAddr = (doc.data && (doc.data as any).email) || null;
    if (wantsEmail || emailAddr) {
      const to =
        typeof emailAddr === "string" && emailAddr
          ? emailAddr
          : String(payload.userId);
      const subject = doc.title || "Thông báo mới";
      const body = doc.body || "Bạn có thông báo mới";
      // simple HTML wrapper
      const html = `<p>${body}</p><p><small>Loại: ${doc.type}</small></p>`;
      // fire-and-forget
      void sendMail({ to, subject, html }).catch((e) =>
        console.error("sendMail error for notification:", e)
      );
    }
  } catch (err) {
    console.error("Notification email send check failed:", err);
  }
  return doc;
}

export async function markRead(userId: string, ids: string[]) {
  const res = await NotificationModel.updateMany(
    { _id: { $in: ids }, userId },
    { $set: { read: true, readAt: new Date() } }
  );
  // optionally emit update
  try {
    const io = getIO();
    if (io) {
      ids.forEach((id) =>
        io
          .to(`user:${userId}`)
          .emit("notification:update", { _id: id, read: true })
      );
    }
  } catch (err) {}
  // emit updated unread count so clients can sync badge
  try {
    const io = getIO();
    if (io) {
      const totalUnread = await NotificationModel.countDocuments({
        userId,
        read: false,
      });
      io.to(`user:${userId}`).emit("notifications:read", {
        count: totalUnread,
      });
    }
  } catch (err) {
    // ignore
  }
  return res;
}

export async function getUnreadCount(userId: string) {
  const totalUnread = await NotificationModel.countDocuments({
    userId,
    read: false,
  });
  return totalUnread;
}

export async function getNotifications(
  userId: string,
  limit = 20,
  cursor?: string
) {
  const q: any = { userId };
  if (cursor) {
    q._id = { $lt: cursor };
  }
  const items = await NotificationModel.find(q)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const totalUnread = await NotificationModel.countDocuments({
    userId,
    read: false,
  });
  return {
    items,
    nextCursor: hasMore ? String(items[items.length - 1]._id) : null,
    totalUnread,
  };
}
