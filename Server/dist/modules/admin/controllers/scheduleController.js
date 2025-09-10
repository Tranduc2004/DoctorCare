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
exports.adminDeleteDoctorShift = exports.adminUpdateDoctorShift = exports.adminReplaceDoctor = exports.adminGetPendingShifts = exports.adminGetAllShifts = exports.adminGetDoctorShifts = exports.adminBulkCreateDoctorShifts = exports.adminCreateDoctorShift = void 0;
const DoctorSchedule_1 = __importDefault(require("../../doctor/models/DoctorSchedule"));
const Doctor_1 = __importDefault(require("../../doctor/models/Doctor"));
const mongoose_1 = __importDefault(require("mongoose"));
// Admin: Tạo 1 ca làm việc cho bác sĩ
const adminCreateDoctorShift = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { doctorId, date, startTime, endTime } = req.body;
        if (!doctorId || !date || !startTime || !endTime) {
            res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
            return;
        }
        const doctor = yield Doctor_1.default.findById(doctorId).lean();
        if (!doctor) {
            res.status(404).json({ message: "Không tìm thấy bác sĩ" });
            return;
        }
        // Normalize inputs
        const normalizedDate = date.includes("T")
            ? date.split("T")[0]
            : date;
        const normalizeTime = (t) => (t ? t.slice(0, 5) : t);
        const normStart = normalizeTime(startTime);
        const normEnd = normalizeTime(endTime);
        // Specialty guard: specialties must differ within identical window
        const existingSameWindow = yield DoctorSchedule_1.default.find({
            date: normalizedDate,
            startTime: normStart,
            endTime: normEnd,
        })
            .populate({ path: "doctorId", select: "specialty" })
            .lean();
        const newDoctor = yield Doctor_1.default.findById(doctorId)
            .select("specialty")
            .lean();
        const newSpec = (_c = (_b = (_a = newDoctor === null || newDoctor === void 0 ? void 0 : newDoctor.specialty) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : newDoctor === null || newDoctor === void 0 ? void 0 : newDoctor.specialty;
        const hasDuplicateSpecialty = existingSameWindow.some((s) => {
            var _a, _b, _c;
            const spec = (_a = s.doctorId) === null || _a === void 0 ? void 0 : _a.specialty;
            const specId = (_c = (_b = spec === null || spec === void 0 ? void 0 : spec.toString) === null || _b === void 0 ? void 0 : _b.call(spec)) !== null && _c !== void 0 ? _c : spec;
            return specId && newSpec && specId === newSpec;
        });
        if (hasDuplicateSpecialty) {
            res
                .status(400)
                .json({ message: "Đã có bác sĩ cùng chuyên khoa trong khung giờ này" });
            return;
        }
        const shift = yield DoctorSchedule_1.default.create({
            doctorId,
            date: normalizedDate,
            startTime: normStart,
            endTime: normEnd,
        });
        res.status(201).json(shift);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tạo ca làm việc", error });
    }
});
exports.adminCreateDoctorShift = adminCreateDoctorShift;
// Admin: Tạo nhiều ca theo mảng
const adminBulkCreateDoctorShifts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { doctorId, slots } = req.body;
        if (!doctorId || !Array.isArray(slots) || slots.length === 0) {
            res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
            return;
        }
        const doctor = yield Doctor_1.default.findById(doctorId).lean();
        if (!doctor) {
            res.status(404).json({ message: "Không tìm thấy bác sĩ" });
            return;
        }
        const newDoctor = yield Doctor_1.default.findById(doctorId)
            .select("specialty")
            .lean();
        if (!newDoctor) {
            res.status(404).json({ message: "Không tìm thấy bác sĩ" });
            return;
        }
        const newSpec = (_c = (_b = (_a = newDoctor === null || newDoctor === void 0 ? void 0 : newDoctor.specialty) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : newDoctor === null || newDoctor === void 0 ? void 0 : newDoctor.specialty;
        const prepared = [];
        for (const s of slots) {
            const date = (s.date || "").includes("T")
                ? s.date.split("T")[0]
                : s.date || "";
            const startTime = (s.startTime || "").slice(0, 5);
            const endTime = (s.endTime || "").slice(0, 5);
            const existingSameWindow = yield DoctorSchedule_1.default.find({
                date,
                startTime,
                endTime,
            })
                .populate({ path: "doctorId", select: "specialty" })
                .lean();
            const hasDuplicateSpecialty = existingSameWindow.some((it) => {
                var _a, _b, _c;
                const spec = (_a = it.doctorId) === null || _a === void 0 ? void 0 : _a.specialty;
                const specId = (_c = (_b = spec === null || spec === void 0 ? void 0 : spec.toString) === null || _b === void 0 ? void 0 : _b.call(spec)) !== null && _c !== void 0 ? _c : spec;
                return specId && newSpec && specId === newSpec;
            });
            if (hasDuplicateSpecialty) {
                res.status(400).json({
                    message: `Khung giờ ${date} ${startTime}-${endTime} đã có bác sĩ cùng chuyên khoa`,
                });
                return;
            }
            prepared.push({ doctorId, date, startTime, endTime });
        }
        const created = yield DoctorSchedule_1.default.insertMany(prepared);
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tạo nhiều ca làm việc", error });
    }
});
exports.adminBulkCreateDoctorShifts = adminBulkCreateDoctorShifts;
// Admin: Lấy lịch theo bác sĩ + khoảng thời gian
const adminGetDoctorShifts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.params;
        const { from, to } = req.query;
        const q = { doctorId };
        if (from || to) {
            q.date = {};
            if (from)
                q.date.$gte = from;
            if (to)
                q.date.$lte = to;
        }
        const items = yield DoctorSchedule_1.default.find(q).sort({ date: 1, startTime: 1 });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy ca làm việc", error });
    }
});
exports.adminGetDoctorShifts = adminGetDoctorShifts;
// Admin: Lấy tất cả ca làm việc của mọi bác sĩ (tùy chọn theo khoảng thời gian)
const adminGetAllShifts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { from, to } = req.query;
        const q = {};
        if (from || to) {
            q.date = {};
            if (from)
                q.date.$gte = from;
            if (to)
                q.date.$lte = to;
        }
        const items = yield DoctorSchedule_1.default.find(q)
            .populate({ path: "doctorId", select: "name email specialty" })
            .sort({ date: 1, startTime: 1 });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy tất cả ca làm việc", error });
    }
});
exports.adminGetAllShifts = adminGetAllShifts;
// Admin: Lấy các ca cần xử lý (pending, rejected, busy)
const adminGetPendingShifts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield DoctorSchedule_1.default.find({
            status: { $in: ["pending", "rejected", "busy"] },
        })
            .populate({ path: "doctorId", select: "name email specialty" })
            .sort({ date: 1, startTime: 1 });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy ca cần xử lý", error });
    }
});
exports.adminGetPendingShifts = adminGetPendingShifts;
// Admin: Thay thế bác sĩ cho ca làm việc
const adminReplaceDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("🚀 adminReplaceDoctor function called!");
    try {
        console.log("=== adminReplaceDoctor Debug ===");
        console.log("Request params:", req.params);
        console.log("Request body:", req.body);
        console.log("Request method:", req.method);
        console.log("Request URL:", req.url);
        const { id } = req.params;
        const { newDoctorId, adminNote, forceReplace } = req.body;
        console.log("Extracted id:", id);
        console.log("Extracted newDoctorId:", newDoctorId);
        console.log("Extracted adminNote:", adminNote);
        console.log("Extracted forceReplace:", forceReplace);
        // Kiểm tra format ObjectId cho schedule ID
        console.log("Validating schedule ID:", id, "Valid:", mongoose_1.default.Types.ObjectId.isValid(id));
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            console.log("❌ Invalid schedule ID:", id);
            res.status(400).json({ message: "ID lịch làm việc không hợp lệ" });
            return;
        }
        if (!newDoctorId) {
            console.log("❌ Missing newDoctorId");
            res.status(400).json({ message: "Thiếu ID bác sĩ mới" });
            return;
        }
        // Kiểm tra format ObjectId
        console.log("Validating newDoctorId:", newDoctorId, "Valid:", mongoose_1.default.Types.ObjectId.isValid(newDoctorId));
        if (!mongoose_1.default.Types.ObjectId.isValid(newDoctorId)) {
            console.log("❌ Invalid newDoctorId:", newDoctorId);
            res.status(400).json({ message: "ID bác sĩ mới không hợp lệ" });
            return;
        }
        const existingShift = yield DoctorSchedule_1.default.findById(id);
        console.log("Found existing shift:", existingShift ? "✅ Yes" : "❌ No");
        if (!existingShift) {
            console.log("❌ Schedule not found with ID:", id);
            res.status(404).json({ message: "Không tìm thấy ca làm việc" });
            return;
        }
        // Kiểm tra xem có phải thay thế bằng chính bác sĩ hiện tại không
        console.log("Current doctorId:", existingShift.doctorId.toString());
        console.log("New doctorId:", newDoctorId);
        console.log("Same doctor check:", existingShift.doctorId.toString() === newDoctorId);
        if (existingShift.doctorId.toString() === newDoctorId) {
            console.log("❌ Cannot replace with same doctor");
            res
                .status(400)
                .json({ message: "Không thể thay thế bằng chính bác sĩ hiện tại" });
            return;
        }
        // Kiểm tra xem lịch đã được đặt chưa
        console.log("Schedule isBooked:", existingShift.isBooked);
        if (existingShift.isBooked) {
            console.log("❌ Cannot replace doctor for booked schedule");
            res
                .status(400)
                .json({ message: "Không thể thay thế bác sĩ cho lịch đã được đặt" });
            return;
        }
        // Kiểm tra bác sĩ mới có tồn tại không
        const newDoctor = yield Doctor_1.default.findById(newDoctorId);
        console.log("Found new doctor:", newDoctor ? "✅ Yes" : "❌ No");
        if (!newDoctor) {
            console.log("❌ New doctor not found with ID:", newDoctorId);
            res.status(404).json({ message: "Không tìm thấy bác sĩ mới" });
            return;
        }
        // Kiểm tra xem bác sĩ mới có bận vào thời gian này không
        // Chỉ kiểm tra xung đột với các ca đã được chấp nhận (accepted)
        console.log("Checking for conflicting shifts...");
        const conflictingShift = yield DoctorSchedule_1.default.findOne({
            doctorId: newDoctorId,
            date: existingShift.date,
            startTime: existingShift.startTime,
            endTime: existingShift.endTime,
            status: "accepted", // Chỉ kiểm tra với ca đã được chấp nhận
        });
        console.log("Found conflicting shift:", conflictingShift ? "✅ Yes" : "❌ No");
        // Nếu có xung đột và không force replace, thì báo lỗi
        if (conflictingShift && !forceReplace) {
            console.log("❌ New doctor has conflicting schedule");
            res.status(400).json({
                message: "Bác sĩ mới đã có lịch làm việc được chấp nhận vào thời gian này. Bạn có thể sử dụng forceReplace=true để bỏ qua kiểm tra này.",
                hasConflict: true,
                conflictingShift: {
                    id: conflictingShift._id,
                    date: conflictingShift.date,
                    startTime: conflictingShift.startTime,
                    endTime: conflictingShift.endTime,
                },
            });
            return;
        }
        // Nếu có xung đột và force replace, thì ghi log cảnh báo
        if (conflictingShift && forceReplace) {
            console.log("⚠️ Force replacing despite conflict - admin override");
        }
        // Lưu doctorId cũ trước khi thay đổi
        const oldDoctorId = existingShift.doctorId;
        // Kiểm tra quy tắc nhiều bác sĩ/không trùng chuyên khoa cho cùng khung giờ
        const sameWindow = yield DoctorSchedule_1.default.find({
            date: existingShift.date,
            startTime: existingShift.startTime,
            endTime: existingShift.endTime,
            _id: { $ne: existingShift._id },
        })
            .populate({ path: "doctorId", select: "specialty" })
            .lean();
        const newDoctorSpec = (_c = (_b = (_a = newDoctor === null || newDoctor === void 0 ? void 0 : newDoctor.specialty) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : newDoctor === null || newDoctor === void 0 ? void 0 : newDoctor.specialty;
        const duplicateSpec = sameWindow.some((it) => {
            var _a, _b, _c;
            const spec = (_a = it.doctorId) === null || _a === void 0 ? void 0 : _a.specialty;
            const specId = (_c = (_b = spec === null || spec === void 0 ? void 0 : spec.toString) === null || _b === void 0 ? void 0 : _b.call(spec)) !== null && _c !== void 0 ? _c : spec;
            return specId && newDoctorSpec && specId === newDoctorSpec;
        });
        if (duplicateSpec) {
            res
                .status(400)
                .json({ message: "Đã có bác sĩ cùng chuyên khoa trong khung giờ này" });
            return;
        }
        // Cập nhật ca làm việc
        existingShift.doctorId = new mongoose_1.default.Types.ObjectId(newDoctorId);
        existingShift.status = "pending";
        existingShift.rejectionReason = undefined;
        existingShift.busyReason = undefined;
        existingShift.adminNote =
            adminNote || `Đã thay thế từ bác sĩ ${oldDoctorId.toString()}`;
        yield existingShift.save();
        console.log("✅ Doctor replacement successful!");
        res.json({
            message: "Đã thay thế bác sĩ thành công",
            shift: existingShift,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi thay thế bác sĩ", error });
    }
});
exports.adminReplaceDoctor = adminReplaceDoctor;
// Admin: Cập nhật ca (không cho sửa khi đã đặt)
const adminUpdateDoctorShift = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield DoctorSchedule_1.default.findById(id);
        if (!existing) {
            res.status(404).json({ message: "Không tìm thấy ca làm việc" });
            return;
        }
        if (existing.isBooked) {
            res.status(400).json({ message: "Không thể sửa ca đã được đặt" });
            return;
        }
        const updated = yield DoctorSchedule_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật ca làm việc", error });
    }
});
exports.adminUpdateDoctorShift = adminUpdateDoctorShift;
// Admin: Xóa ca (không cho xóa khi đã đặt)
const adminDeleteDoctorShift = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield DoctorSchedule_1.default.findById(id);
        if (!existing) {
            res.status(404).json({ message: "Không tìm thấy ca làm việc" });
            return;
        }
        if (existing.isBooked) {
            res.status(400).json({ message: "Không thể xóa ca đã được đặt" });
            return;
        }
        yield DoctorSchedule_1.default.findByIdAndDelete(id);
        res.json({ message: "Đã xóa ca làm việc" });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi xóa ca làm việc", error });
    }
});
exports.adminDeleteDoctorShift = adminDeleteDoctorShift;
