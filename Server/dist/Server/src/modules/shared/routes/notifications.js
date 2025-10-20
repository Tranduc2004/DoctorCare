"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationService_1 = require("../../../shared/services/notificationService");
const router = express_1.default.Router();
// GET /api/notifications/unread-count
router.get("/unread-count", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.query.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthenticated" });
        const { getUnreadCount } = yield Promise.resolve().then(() => __importStar(require("../../../shared/services/notificationService")));
        const totalUnread = yield getUnreadCount(String(userId));
        // messages count not available here; return 0 as placeholder
        res.json({ notifications: totalUnread, messages: 0 });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}));
// GET /api/notifications
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.query.userId;
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
        const cursor = req.query.cursor;
        const data = yield (0, notificationService_1.getNotifications)(String(userId), limit, cursor);
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}));
// POST /api/notifications/mark-read
router.post("/mark-read", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.body.userId;
        const ids = req.body.ids;
        if (!userId)
            return res.status(401).json({ error: "Unauthenticated" });
        if (!Array.isArray(ids))
            return res.status(400).json({ error: "ids required" });
        const r = yield (0, notificationService_1.markRead)(String(userId), ids);
        // updateMany return shape varies between mongoose versions; normalize safely
        const updated = Number((_c = (_b = r.modifiedCount) !== null && _b !== void 0 ? _b : r.nModified) !== null && _c !== void 0 ? _c : 0);
        res.json({ success: true, updated });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}));
exports.default = router;
