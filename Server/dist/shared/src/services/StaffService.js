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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
/**
 * Centralized Staff Service
 * Provides business logic for both Main Server and Pharmacy-Service
 * Eliminates code duplication and ensures consistency
 */
class StaffService {
    /**
     * Get all staff with pagination and filtering
     */
    static getAllStaff(staffModel, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Build filter object
                const filter = {};
                if (query.status)
                    filter.status = query.status;
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
                    staffModel
                        .find(filter)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit)
                        .select("-password"),
                    staffModel.countDocuments(filter),
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
                throw new Error(error instanceof Error ? error.message : "Failed to get staff");
            }
        });
    }
    /**
     * Get staff by ID
     */
    static getStaffById(staffModel, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const staff = yield staffModel.findById(id).select("-password");
                if (!staff) {
                    throw new Error("Staff not found");
                }
                return staff;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to get staff");
            }
        });
    }
    /**
     * Create new staff (registration)
     */
    static createStaff(staffModel, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email, password } = data;
                if (!name || !email || !password) {
                    throw new Error("Name, email, and password are required");
                }
                // Check if email already exists
                const existingStaff = yield staffModel.findOne({ email });
                if (existingStaff) {
                    throw new Error("Email already exists");
                }
                const staff = new staffModel({
                    name,
                    email,
                    password,
                    role: "staff",
                });
                yield staff.save();
                // Remove password from response
                const staffResponse = staff.toObject();
                const { password: _ } = staffResponse, staffWithoutPassword = __rest(staffResponse, ["password"]);
                return staffWithoutPassword;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to create staff");
            }
        });
    }
    /**
     * Login staff
     */
    static loginStaff(staffModel, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!email || !password) {
                    throw new Error("Email and password are required");
                }
                // Find staff with password
                const staff = yield staffModel.findOne({ email }).select("+password");
                if (!staff) {
                    throw new Error("Invalid credentials");
                }
                // Check if staff is approved and active
                if (staff.status !== "approved") {
                    throw new Error("Account not approved yet");
                }
                if (!staff.active) {
                    throw new Error("Account is inactive");
                }
                // Compare password (assuming staff has comparePassword method)
                const isMatch = yield staff.comparePassword(password);
                if (!isMatch) {
                    throw new Error("Invalid credentials");
                }
                // Remove password from response
                const staffResponse = staff.toObject();
                const { password: __ } = staffResponse, staffWithoutPassword = __rest(staffResponse, ["password"]);
                return staffWithoutPassword;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to login");
            }
        });
    }
    /**
     * Approve staff
     */
    static approveStaff(staffModel_1, id_1) {
        return __awaiter(this, arguments, void 0, function* (staffModel, id, adminId = "system") {
            try {
                const staff = yield staffModel
                    .findByIdAndUpdate(id, {
                    status: "approved",
                    approvedBy: adminId,
                    approvedAt: new Date(),
                    active: true,
                }, { new: true, runValidators: true })
                    .select("-password");
                if (!staff) {
                    throw new Error("Staff not found");
                }
                return staff;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to approve staff");
            }
        });
    }
    /**
     * Reject staff
     */
    static rejectStaff(staffModel_1, id_1, reason_1) {
        return __awaiter(this, arguments, void 0, function* (staffModel, id, reason, adminId = "system") {
            try {
                if (!reason) {
                    throw new Error("Rejection reason is required");
                }
                const staff = yield staffModel
                    .findByIdAndUpdate(id, {
                    status: "rejected",
                    rejectedReason: reason,
                    approvedBy: adminId,
                    approvedAt: new Date(),
                    active: false,
                }, { new: true, runValidators: true })
                    .select("-password");
                if (!staff) {
                    throw new Error("Staff not found");
                }
                return staff;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to reject staff");
            }
        });
    }
    /**
     * Update staff status (active/inactive)
     */
    static updateStaffStatus(staffModel, id, active) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (typeof active !== "boolean") {
                    throw new Error("Active status must be a boolean");
                }
                const staff = yield staffModel
                    .findByIdAndUpdate(id, { active }, { new: true, runValidators: true })
                    .select("-password");
                if (!staff) {
                    throw new Error("Staff not found");
                }
                return staff;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to update staff status");
            }
        });
    }
    /**
     * Update staff role
     */
    static updateStaffRole(staffModel, id, role) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!role || !["admin", "staff"].includes(role)) {
                    throw new Error("Valid role (admin or staff) is required");
                }
                const staff = yield staffModel
                    .findByIdAndUpdate(id, { role }, { new: true, runValidators: true })
                    .select("-password");
                if (!staff) {
                    throw new Error("Staff not found");
                }
                return staff;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to update staff role");
            }
        });
    }
    /**
     * Delete staff
     */
    static deleteStaff(staffModel, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield staffModel.findByIdAndDelete(id);
                if (!result) {
                    throw new Error("Staff not found");
                }
                return true;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to delete staff");
            }
        });
    }
    /**
     * Get staff statistics
     */
    static getStaffStats(staffModel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalStats, statusStats, roleStats] = yield Promise.all([
                    staffModel.countDocuments(),
                    staffModel.aggregate([
                        { $group: { _id: "$status", count: { $sum: 1 } } },
                    ]),
                    staffModel.aggregate([
                        { $group: { _id: "$role", count: { $sum: 1 } } },
                    ]),
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
                return stats;
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : "Failed to get staff statistics");
            }
        });
    }
}
exports.StaffService = StaffService;
