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
exports.StaffController = void 0;
const Staff_1 = require("../../../models/Staff");
class StaffController {
    // Get all staff with pagination and filtering
    static getAllStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const status = req.query.status
                    ? req.query.status
                    : undefined;
                const query = {
                    status,
                    role: req.query.role,
                    active: req.query.active ? req.query.active === "true" : undefined,
                    search: req.query.search,
                    page: req.query.page ? parseInt(req.query.page, 10) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
                    sortBy: req.query.sortBy || "createdAt",
                    sortOrder: req.query.sortOrder || "desc",
                };
                // Build filter object
                const filter = {};
                if (status)
                    filter.status = status;
                if (query.role)
                    filter.role = query.role;
                if (query.active !== undefined)
                    filter.active = query.active;
                if (query.search) {
                    filter.$or = [
                        { name: { $regex: query.search, $options: "i" } },
                        { email: { $regex: query.search, $options: "i" } },
                    ];
                }
                // Build sort object
                const sort = {};
                sort[query.sortBy || "createdAt"] = query.sortOrder === "asc" ? 1 : -1;
                // Calculate pagination
                const page = query.page || 1;
                const limit = query.limit || 10;
                const skip = (page - 1) * limit;
                // Execute queries
                const [staff, total] = yield Promise.all([
                    Staff_1.Staff.find(filter)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit)
                        .select("-password"),
                    Staff_1.Staff.countDocuments(filter),
                ]);
                const result = {
                    staff,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit,
                    },
                };
                const response = {
                    success: true,
                    data: result,
                    message: "Staff retrieved successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error getting staff:", error);
                const response = {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get staff",
                };
                res.status(500).json(response);
            }
        });
    }
    // Get staff by ID
    static getStaffById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const staff = yield Staff_1.Staff.findById(id).select("-password");
                if (!staff) {
                    const response = {
                        success: false,
                        error: "Staff not found",
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    data: staff,
                    message: "Staff retrieved successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error getting staff by ID:", error);
                const response = {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get staff",
                };
                res.status(500).json(response);
            }
        });
    }
    // Approve staff
    static approveStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || "system";
                const staff = yield Staff_1.Staff.findByIdAndUpdate(id, {
                    status: "approved",
                    approvedBy: adminId,
                    approvedAt: new Date(),
                    active: true,
                }, { new: true, runValidators: true }).select("-password");
                if (!staff) {
                    const response = {
                        success: false,
                        error: "Staff not found",
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    data: staff,
                    message: "Staff approved successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error approving staff:", error);
                const response = {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to approve staff",
                };
                res.status(500).json(response);
            }
        });
    }
    // Reject staff
    static rejectStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const { reason } = req.body;
                const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || "system";
                if (!reason) {
                    const response = {
                        success: false,
                        error: "Rejection reason is required",
                    };
                    res.status(400).json(response);
                    return;
                }
                const staff = yield Staff_1.Staff.findByIdAndUpdate(id, {
                    status: "rejected",
                    rejectedReason: reason,
                    approvedBy: adminId,
                    approvedAt: new Date(),
                    active: false,
                }, { new: true, runValidators: true }).select("-password");
                if (!staff) {
                    const response = {
                        success: false,
                        error: "Staff not found",
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    data: staff,
                    message: "Staff rejected successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error rejecting staff:", error);
                const response = {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to reject staff",
                };
                res.status(500).json(response);
            }
        });
    }
    // Update staff status (active/inactive)
    static updateStaffStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { active } = req.body;
                if (typeof active !== "boolean") {
                    const response = {
                        success: false,
                        error: "Active status must be a boolean",
                    };
                    res.status(400).json(response);
                    return;
                }
                const staff = yield Staff_1.Staff.findByIdAndUpdate(id, { active }, { new: true, runValidators: true }).select("-password");
                if (!staff) {
                    const response = {
                        success: false,
                        error: "Staff not found",
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    data: staff,
                    message: `Staff ${active ? "activated" : "deactivated"} successfully`,
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error updating staff status:", error);
                const response = {
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to update staff status",
                };
                res.status(500).json(response);
            }
        });
    }
    // Update staff role
    static updateStaffRole(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { role } = req.body;
                if (!role || !["admin", "staff"].includes(role)) {
                    const response = {
                        success: false,
                        error: "Valid role (admin or staff) is required",
                    };
                    res.status(400).json(response);
                    return;
                }
                const staff = yield Staff_1.Staff.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select("-password");
                if (!staff) {
                    const response = {
                        success: false,
                        error: "Staff not found",
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    data: staff,
                    message: "Staff role updated successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error updating staff role:", error);
                const response = {
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to update staff role",
                };
                res.status(500).json(response);
            }
        });
    }
    // Delete staff
    static deleteStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const result = yield Staff_1.Staff.findByIdAndDelete(id);
                const success = result !== null;
                if (!success) {
                    const response = {
                        success: false,
                        error: "Staff not found",
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: "Staff deleted successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error deleting staff:", error);
                const response = {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to delete staff",
                };
                res.status(500).json(response);
            }
        });
    }
    // Get staff statistics
    static getStaffStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalStats, statusStats, roleStats] = yield Promise.all([
                    Staff_1.Staff.countDocuments(),
                    Staff_1.Staff.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                    Staff_1.Staff.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
                ]);
                const stats = {
                    total: totalStats,
                    byStatus: statusStats.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    byRole: roleStats.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                };
                const response = {
                    success: true,
                    data: stats,
                    message: "Staff statistics retrieved successfully",
                };
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error getting staff stats:", error);
                const response = {
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get staff statistics",
                };
                res.status(500).json(response);
            }
        });
    }
}
exports.StaffController = StaffController;
