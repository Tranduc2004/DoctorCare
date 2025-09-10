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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getUserStats = exports.deleteUser = exports.updateUser = exports.getUsersByRole = exports.getAllUsers = void 0;
const Patient_1 = __importDefault(require("../../patient/models/Patient"));
const Doctor_1 = __importDefault(require("../../doctor/models/Doctor"));
// Admin: Lấy tất cả người dùng
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [patients, doctors] = yield Promise.all([
            Patient_1.default.find().select("-password").sort({ createdAt: -1 }).lean(),
            Doctor_1.default.find().select("-password").sort({ createdAt: -1 }).lean(),
        ]);
        const users = [
            ...patients.map((p) => (Object.assign(Object.assign({}, p), { role: "patient" }))),
            ...doctors.map((d) => (Object.assign(Object.assign({}, d), { role: "doctor" }))),
        ];
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
    }
});
exports.getAllUsers = getAllUsers;
// Admin: Lấy người dùng theo role
const getUsersByRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role } = req.params;
        if (role === "patient") {
            const patients = yield Patient_1.default.find()
                .select("-password")
                .sort({ createdAt: -1 })
                .lean();
            res.json(patients.map((p) => (Object.assign(Object.assign({}, p), { role: "patient" }))));
            return;
        }
        if (role === "doctor") {
            const { status } = req.query;
            const filter = {};
            if (status)
                filter.status = status;
            const doctors = yield Doctor_1.default.find(filter)
                .select("-password")
                .populate("specialty", "name")
                .sort({ createdAt: -1 })
                .lean();
            res.json(doctors.map((d) => (Object.assign(Object.assign({}, d), { role: "doctor" }))));
            return;
        }
        if (role === "admin") {
            // Hệ thống không trộn admin vào Patient/Doctor ở controllers hiện tại
            res.json([]);
            return;
        }
        res.json([]);
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
    }
});
exports.getUsersByRole = getUsersByRole;
// Admin: Cập nhật thông tin người dùng
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const _a = req.body, { role } = _a, updateData = __rest(_a, ["role"]);
        // Không cho phép cập nhật password qua API này
        delete updateData.password;
        // Xác định collection dựa trên role được gửi lên hoặc thử cả hai
        let user = null;
        if (role === "patient") {
            user = yield Patient_1.default.findByIdAndUpdate(id, updateData, { new: true })
                .select("-password")
                .lean();
            if (user)
                user.role = "patient";
        }
        else if (role === "doctor") {
            user = yield Doctor_1.default.findByIdAndUpdate(id, updateData, { new: true })
                .select("-password")
                .lean();
            if (user)
                user.role = "doctor";
        }
        else {
            // Thử tìm ở cả hai khi không truyền role
            user = yield Patient_1.default.findByIdAndUpdate(id, updateData, { new: true })
                .select("-password")
                .lean();
            if (user)
                user.role = "patient";
            if (!user) {
                user = yield Doctor_1.default.findByIdAndUpdate(id, updateData, { new: true })
                    .select("-password")
                    .lean();
                if (user)
                    user.role = "doctor";
            }
        }
        if (!user) {
            res.status(404).json({ message: "Không tìm thấy người dùng" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật người dùng", error });
    }
});
exports.updateUser = updateUser;
// Admin: Xóa người dùng
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Thử xóa ở cả hai collection
        let deleted = yield Patient_1.default.findByIdAndDelete(id);
        if (!deleted) {
            deleted = yield Doctor_1.default.findByIdAndDelete(id);
        }
        if (!deleted) {
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
        const [patients, doctors] = yield Promise.all([
            Patient_1.default.countDocuments(),
            Doctor_1.default.countDocuments(),
        ]);
        const total = patients + doctors; // Admin tách riêng
        const admins = 0;
        res.json({ total, patients, doctors, admins });
        return;
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê", error });
        return;
    }
});
exports.getUserStats = getUserStats;
// Admin: Chi tiết người dùng theo id
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Thử tìm ở bệnh nhân trước
        let user = yield Patient_1.default.findById(id).select("-password").lean();
        if (user) {
            res.json(Object.assign(Object.assign({}, user), { role: "patient" }));
            return;
        }
        // Nếu không có, thử ở bác sĩ
        user = yield Doctor_1.default.findById(id).select("-password").lean();
        if (user) {
            res.json(Object.assign(Object.assign({}, user), { role: "doctor" }));
            return;
        }
        res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy chi tiết người dùng", error });
    }
});
exports.getUserById = getUserById;
