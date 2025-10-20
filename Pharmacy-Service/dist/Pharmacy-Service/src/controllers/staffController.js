"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = exports.loginStaff = exports.registerStaff = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_1 = require("@medicare/shared");
const Staff_1 = __importDefault(require("../models/Staff"));
const registerStaff = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const data = { name, email, password };
        const staffWithoutPassword = await shared_1.StaffService.createStaff(Staff_1.default, data);
        const response = {
            success: true,
            data: staffWithoutPassword,
            message: "Staff registration submitted for approval",
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Error registering staff:", error);
        const status = error instanceof Error && error.message === "Email already exists"
            ? 400
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to register staff",
        };
        res.status(status).json(response);
    }
};
exports.registerStaff = registerStaff;
const loginStaff = async (req, res) => {
    try {
        const { email, password } = req.body;
        const staffWithoutPassword = await shared_1.StaffService.loginStaff(Staff_1.default, email, password);
        const token = jsonwebtoken_1.default.sign({
            id: staffWithoutPassword._id,
            email: staffWithoutPassword.email,
            role: staffWithoutPassword.role,
        }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "24h" });
        const response = {
            success: true,
            data: {
                staff: staffWithoutPassword,
                token,
            },
            message: "Login successful",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error logging in staff:", error);
        const status = error instanceof Error &&
            [
                "Invalid credentials",
                "Account not approved yet",
                "Account is inactive",
            ].includes(error.message)
            ? 401
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to login",
        };
        res.status(status).json(response);
    }
};
exports.loginStaff = loginStaff;
const getMyProfile = async (req, res) => {
    var _a;
    try {
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        if (!staffId) {
            const response = {
                success: false,
                error: "Authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const staff = await shared_1.StaffService.getStaffById(Staff_1.default, staffId);
        const response = {
            success: true,
            data: staff,
            message: "Profile retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting profile:", error);
        const status = error instanceof Error && error.message === "Staff not found" ? 404 : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get profile",
        };
        res.status(status).json(response);
    }
};
exports.getMyProfile = getMyProfile;
//# sourceMappingURL=staffController.js.map