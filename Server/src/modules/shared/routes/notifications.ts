import express from "express";
import {
  getNotifications,
  markRead,
} from "../../../shared/services/notificationService";

const router = express.Router();

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = (req as any).user?._id || req.query.userId;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });
    const { getUnreadCount } = await import(
      "../../../shared/services/notificationService"
    );
    const totalUnread = await getUnreadCount(String(userId));
    // messages count not available here; return 0 as placeholder
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
    const limit = Number(req.query.limit) || 20;
    // Allow an unauthenticated lightweight request for small public queries (e.g., badge checks)
    // If there's no userId and the client asked only for a single item (limit=1) or set public=1,
    // respond with an empty set instead of 401. This prevents noisy 401 responses from
    // clients that check the bell count before authenticating.
    if (!userId) {
      if (limit === 1 || String(req.query.public) === "1") {
        return res.json({ items: [], nextCursor: null, totalUnread: 0 });
      }
      return res.status(401).json({ error: "Unauthenticated" });
    }
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
    // updateMany return shape varies between mongoose versions; normalize safely
    const updated = Number(
      (r as any).modifiedCount ?? (r as any).nModified ?? 0
    );
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
