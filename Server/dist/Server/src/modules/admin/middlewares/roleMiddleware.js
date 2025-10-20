"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdminRole = void 0;
const requireAdminRole = (req, res, next) => {
    try {
        const adminRole = req.adminRole;
        if (!adminRole || adminRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Yêu cầu quyền admin",
            });
        }
        next();
    }
    catch (error) {
        console.error("Admin role verification error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi xác thực quyền",
        });
    }
};
exports.requireAdminRole = requireAdminRole;
const requireSuperAdmin = (req, res, next) => {
    try {
        const adminRole = req.adminRole;
        const adminUsername = req.adminUsername;
        // Chỉ admin chính mới có quyền super admin
        if (!adminRole || adminRole !== "admin" || adminUsername !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Yêu cầu quyền super admin",
            });
        }
        next();
    }
    catch (error) {
        console.error("Super admin verification error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi xác thực quyền",
        });
    }
};
exports.requireSuperAdmin = requireSuperAdmin;
