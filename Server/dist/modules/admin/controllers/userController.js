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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.deleteUser = exports.updateUser = exports.getUsersByRole = exports.getAllUsers = void 0;
const Patient_1 = __importDefault(require("../../patient/models/Patient"));
// Admin: Lấy tất cả người dùng
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield Patient_1.default.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();
        res.json(users);
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
        return;
    }
});
exports.getAllUsers = getAllUsers;
// Admin: Lấy người dùng theo role
const getUsersByRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role } = req.params;
        const users = yield Patient_1.default.find({ role })
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();
        res.json(users);
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
        return;
    }
});
exports.getUsersByRole = getUsersByRole;
// Admin: Cập nhật thông tin người dùng
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Không cho phép cập nhật password qua API này
        delete updateData.password;
        const user = yield Patient_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
        }).select("-password");
        if (!user) {
            res.status(404).json({ message: "Không tìm thấy người dùng" });
            return;
        }
        res.json(user);
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật người dùng", error });
        return;
    }
});
exports.updateUser = updateUser;
// Admin: Xóa người dùng
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield Patient_1.default.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({ message: "Không tìm thấy người dùng" });
            return;
        }
        res.json({ message: "Xóa người dùng thành công" });
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi xóa người dùng", error });
        return;
    }
});
exports.deleteUser = deleteUser;
// Admin: Thống kê người dùng
const getUserStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const total = yield Patient_1.default.countDocuments();
        const patients = yield Patient_1.default.countDocuments({ role: "patient" });
        const doctors = yield Patient_1.default.countDocuments({ role: "doctor" });
        const admins = yield Patient_1.default.countDocuments({ role: "admin" });
        res.json({
            total,
            patients,
            doctors,
            admins,
        });
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê", error });
        return;
    }
});
exports.getUserStats = getUserStats;
