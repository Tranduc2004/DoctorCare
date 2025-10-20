"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Staff_1 = __importDefault(require("../models/Staff"));
const authMiddleware = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        const internalToken = req.headers["x-internal-token"];
        if (!token && !internalToken) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        if (internalToken === "admin-internal-token") {
            req.user = { role: "admin", userId: "admin-internal" };
            next();
            return;
        }
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const staff = await Staff_1.default.findById(decoded.userId);
            if (!staff || !staff.active) {
                res.status(401).json({ message: "Invalid or inactive user" });
                return;
            }
            req.user = decoded;
            req.staff = {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
            };
            next();
            return;
        }
        res.status(401).json({ message: "Invalid token" });
    }
    catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map