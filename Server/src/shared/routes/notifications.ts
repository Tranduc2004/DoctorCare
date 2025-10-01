import express from "express";
import { getNotifications, markRead } from "../services/notificationService";

const router = express.Router();

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = (req as any).user?._id || req.query.userId;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });
    const { getUnreadCount } = await import("../services/notificationService");
    const totalUnread = await getUnreadCount(String(userId));
    // messages count is not implemented server-side here; return 0 as a placeholder
    res.json({ notifications: totalUnread, messages: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user?._id || req.query.userId;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor as string | undefined;
    const data = await getNotifications(String(userId), limit, cursor);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications/mark-read
router.post("/mark-read", async (req, res) => {
  try {
    const userId = (req as any).user?._id || req.body.userId;
    const ids = req.body.ids as string[];
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });
    if (!Array.isArray(ids))
      return res.status(400).json({ error: "ids required" });
    const r = await markRead(String(userId), ids);
    // modern Mongo returns modifiedCount; fall back to 0
    res.json({ success: true, updated: (r as any)?.modifiedCount ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
