"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const StaffModel_1 = require("./StaffModel");
class StaffService {
    // Create new staff
    static async createStaff(staffData) {
        try {
            const existingStaff = await StaffModel_1.Staff.findOne({ email: staffData.email });
            if (existingStaff) {
                throw new Error("Email already exists");
            }
            const staff = new StaffModel_1.Staff(staffData);
            return await staff.save();
        }
        catch (error) {
            throw error;
        }
    }
    // Get all staff with filtering and pagination
    static async getAllStaff(query = {}) {
        try {
            const { status, role, active, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", } = query;
            // Build filter object
            const filter = {};
            if (status)
                filter.status = status;
            if (role)
                filter.role = role;
            if (active !== undefined)
                filter.active = active;
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ];
            }
            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === "asc" ? 1 : -1;
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Execute queries
            const [staff, total] = await Promise.all([
                StaffModel_1.Staff.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .select("-password"),
                StaffModel_1.Staff.countDocuments(filter),
            ]);
            return {
                staff,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            };
        }
        catch (error) {
            throw error;
        }
    }
    // Get staff by ID
    static async getStaffById(id) {
        try {
            return await StaffModel_1.Staff.findById(id).select("-password");
        }
        catch (error) {
            throw error;
        }
    }
    // Get staff by email (for authentication)
    static async getStaffByEmail(email) {
        try {
            return await StaffModel_1.Staff.findOne({ email }).select("+password");
        }
        catch (error) {
            throw error;
        }
    }
    // Update staff
    static async updateStaff(id, updateData) {
        try {
            return await StaffModel_1.Staff.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            }).select("-password");
        }
        catch (error) {
            throw error;
        }
    }
    // Approve staff
    static async approveStaff(id, approvedBy) {
        try {
            return await StaffModel_1.Staff.findByIdAndUpdate(id, {
                status: "approved",
                approvedBy,
                approvedAt: new Date(),
                active: true,
            }, { new: true, runValidators: true }).select("-password");
        }
        catch (error) {
            throw error;
        }
    }
    // Reject staff
    static async rejectStaff(id, rejectedReason, rejectedBy) {
        try {
            return await StaffModel_1.Staff.findByIdAndUpdate(id, {
                status: "rejected",
                rejectedReason,
                approvedBy: rejectedBy,
                approvedAt: new Date(),
                active: false,
            }, { new: true, runValidators: true }).select("-password");
        }
        catch (error) {
            throw error;
        }
    }
    // Toggle staff active status
    static async toggleStaffStatus(id, active) {
        try {
            return await StaffModel_1.Staff.findByIdAndUpdate(id, { active }, { new: true, runValidators: true }).select("-password");
        }
        catch (error) {
            throw error;
        }
    }
    // Update staff role
    static async updateStaffRole(id, role) {
        try {
            return await StaffModel_1.Staff.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select("-password");
        }
        catch (error) {
            throw error;
        }
    }
    // Delete staff
    static async deleteStaff(id) {
        try {
            const result = await StaffModel_1.Staff.findByIdAndDelete(id);
            return result !== null;
        }
        catch (error) {
            throw error;
        }
    }
    // Get staff statistics
    static async getStaffStats() {
        try {
            const [totalStats, statusStats, roleStats] = await Promise.all([
                StaffModel_1.Staff.countDocuments(),
                StaffModel_1.Staff.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
                StaffModel_1.Staff.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
            ]);
            return {
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
        }
        catch (error) {
            throw error;
        }
    }
}
exports.StaffService = StaffService;
//# sourceMappingURL=StaffService.js.map