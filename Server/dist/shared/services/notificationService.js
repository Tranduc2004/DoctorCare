"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.markRead = markRead;
exports.getUnreadCount = getUnreadCount;
exports.getNotifications = getNotifications;
const Notification_model_1 = require("../models/Notification.model");
const socket_1 = require("../../utils/socket");
const utils_1 = require("../utils");
function createNotification(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield Notification_model_1.NotificationModel.create(Object.assign(Object.assign({}, payload), { userId: payload.userId }));
        // Emit via socket if available
        try {
            const io = (0, socket_1.getIO)();
            if (io) {
                io.to(`user:${String(payload.userId)}`).emit("notification:new", doc);
            }
        }
        catch (err) {
            console.error("Emit notification error:", err);
        }
        // Optionally send email if requested (best-effort, non-blocking)
        try {
            const wantsEmail = Array.isArray(doc.channels) && doc.channels.includes("email");
            const emailAddr = (doc.data && doc.data.email) || null;
            if (wantsEmail || emailAddr) {
                const to = typeof emailAddr === "string" && emailAddr
                    ? emailAddr
                    : String(payload.userId);
                const subject = doc.title || "Thông báo mới";
                const body = doc.body || "Bạn có thông báo mới";
                // simple HTML wrapper
                const html = `<p>${body}</p><p><small>Loại: ${doc.type}</small></p>`;
                // fire-and-forget
                void (0, utils_1.sendMail)({ to, subject, html }).catch((e) => console.error("sendMail error for notification:", e));
            }
        }
        catch (err) {
            console.error("Notification email send check failed:", err);
        }
        return doc;
    });
}
function markRead(userId, ids) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield Notification_model_1.NotificationModel.updateMany({ _id: { $in: ids }, userId }, { $set: { read: true, readAt: new Date() } });
        // optionally emit update
        try {
            const io = (0, socket_1.getIO)();
            if (io) {
                ids.forEach((id) => io
                    .to(`user:${userId}`)
                    .emit("notification:update", { _id: id, read: true }));
            }
        }
        catch (err) { }
        // emit updated unread count so clients can sync badge
        try {
            const io = (0, socket_1.getIO)();
            if (io) {
                const totalUnread = yield Notification_model_1.NotificationModel.countDocuments({
                    userId,
                    read: false,
                });
                io.to(`user:${userId}`).emit("notifications:read", {
                    count: totalUnread,
                });
            }
        }
        catch (err) {
            // ignore
        }
        return res;
    });
}
function getUnreadCount(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalUnread = yield Notification_model_1.NotificationModel.countDocuments({
            userId,
            read: false,
        });
        return totalUnread;
    });
}
function getNotifications(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, limit = 20, cursor) {
        const q = { userId };
        if (cursor) {
            q._id = { $lt: cursor };
        }
        const items = yield Notification_model_1.NotificationModel.find(q)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .lean();
        const hasMore = items.length > limit;
        if (hasMore)
            items.pop();
        const totalUnread = yield Notification_model_1.NotificationModel.countDocuments({
            userId,
            read: false,
        });
        return {
            items,
            nextCursor: hasMore ? String(items[items.length - 1]._id) : null,
            totalUnread,
        };
    });
}
