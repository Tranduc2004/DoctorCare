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
exports.getScheduleStats = exports.deleteSchedule = exports.updateSchedule = exports.reportBusy = exports.rejectSchedule = exports.acceptSchedule = exports.getMySchedules = exports.getDoctorSchedulesById = exports.getDoctorSchedules = exports.createSchedule = void 0;
const DoctorSchedule_1 = __importDefault(require("../models/DoctorSchedule"));
// Doctor: Tạo lịch làm việc mới
const createSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, date, startTime, endTime } = req.body;
        if (!doctorId || !date || !startTime || !endTime) {
            res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
            return;
        }
        const schedule = yield DoctorSchedule_1.default.create({
            doctorId,
            date,
            startTime,
            endTime,
        });
        res.status(201).json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tạo lịch", error });
    }
});
exports.createSchedule = createSchedule;
// Doctor: Lấy lịch làm việc của bác sĩ (cho bệnh nhân đặt lịch)
const getDoctorSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const schedules = yield DoctorSchedule_1.default.find({
            doctorId,
            status: "accepted",
            isBooked: false,
        })
            .sort({ date: 1, startTime: 1 })
            .lean();
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch", error });
    }
});
exports.getDoctorSchedules = getDoctorSchedules;
// Lấy lịch làm việc của bác sĩ cụ thể (dùng path parameter)
const getDoctorSchedulesById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.params;
        const schedules = yield DoctorSchedule_1.default.find({
            doctorId,
            status: "accepted",
            isBooked: false,
        })
            .sort({ date: 1, startTime: 1 })
            .lean();
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch", error });
    }
});
exports.getDoctorSchedulesById = getDoctorSchedulesById;
// Doctor: Lấy tất cả lịch làm việc của bác sĩ (bao gồm đã đặt)
const getMySchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        const schedules = yield DoctorSchedule_1.default.find({ doctorId })
            .sort({ date: 1, startTime: 1 })
            .lean();
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch của tôi", error });
    }
});
exports.getMySchedules = getMySchedules;
// Doctor: Chấp nhận lịch làm việc
const acceptSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId } = req.body;
        const schedule = yield DoctorSchedule_1.default.findOne({
            _id: id,
            doctorId,
            status: "pending",
        });
        if (!schedule) {
            res
                .status(404)
                .json({ message: "Không tìm thấy lịch làm việc chờ xác nhận" });
            return;
        }
        schedule.status = "accepted";
        yield schedule.save();
        res.json({ message: "Đã chấp nhận lịch làm việc", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi chấp nhận lịch", error });
    }
});
exports.acceptSchedule = acceptSchedule;
// Doctor: Từ chối lịch làm việc
const rejectSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId, rejectionReason } = req.body;
        if (!rejectionReason) {
            res.status(400).json({ message: "Vui lòng cung cấp lý do từ chối" });
            return;
        }
        const schedule = yield DoctorSchedule_1.default.findOne({
            _id: id,
            doctorId,
            status: "pending",
        });
        if (!schedule) {
            res
                .status(404)
                .json({ message: "Không tìm thấy lịch làm việc chờ xác nhận" });
            return;
        }
        schedule.status = "rejected";
        schedule.rejectionReason = rejectionReason;
        yield schedule.save();
        res.json({ message: "Đã từ chối lịch làm việc", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi từ chối lịch", error });
    }
});
exports.rejectSchedule = rejectSchedule;
// Doctor: Báo bận với lý do
const reportBusy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId, busyReason } = req.body;
        if (!busyReason) {
            res.status(400).json({ message: "Vui lòng cung cấp lý do bận" });
            return;
        }
        const schedule = yield DoctorSchedule_1.default.findOne({
            _id: id,
            doctorId,
            status: "pending",
        });
        if (!schedule) {
            res
                .status(404)
                .json({ message: "Không tìm thấy lịch làm việc chờ xác nhận" });
            return;
        }
        schedule.status = "busy";
        schedule.busyReason = busyReason;
        yield schedule.save();
        res.json({ message: "Đã báo bận lịch làm việc", schedule });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi báo bận lịch", error });
    }
});
exports.reportBusy = reportBusy;
// Doctor: Cập nhật lịch làm việc
const updateSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId } = req.body;
        const update = req.body;
        // Kiểm tra xem lịch có thuộc về bác sĩ này không
        const existingSchedule = yield DoctorSchedule_1.default.findOne({
            _id: id,
            doctorId,
        });
        if (!existingSchedule) {
            res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
            return;
        }
        // Không cho phép cập nhật nếu lịch đã được đặt
        if (existingSchedule.isBooked) {
            res.status(400).json({ message: "Không thể cập nhật lịch đã được đặt" });
            return;
        }
        const schedule = yield DoctorSchedule_1.default.findByIdAndUpdate(id, update, {
            new: true,
        });
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật lịch", error });
    }
});
exports.updateSchedule = updateSchedule;
// Doctor: Xóa lịch làm việc
const deleteSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId } = req.body;
        const schedule = yield DoctorSchedule_1.default.findOne({ _id: id, doctorId });
        if (!schedule) {
            res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
            return;
        }
        if (schedule.isBooked) {
            res.status(400).json({ message: "Không thể xóa lịch đã được đặt" });
            return;
        }
        yield DoctorSchedule_1.default.findByIdAndDelete(id);
        res.json({ message: "Xóa lịch làm việc thành công" });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi xóa lịch làm việc", error });
    }
});
exports.deleteSchedule = deleteSchedule;
// Doctor: Lấy thống kê lịch làm việc
const getScheduleStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const total = yield DoctorSchedule_1.default.countDocuments({ doctorId });
        const pending = yield DoctorSchedule_1.default.countDocuments({
            doctorId,
            status: "pending",
        });
        const accepted = yield DoctorSchedule_1.default.countDocuments({
            doctorId,
            status: "accepted",
        });
        const rejected = yield DoctorSchedule_1.default.countDocuments({
            doctorId,
            status: "rejected",
        });
        const busy = yield DoctorSchedule_1.default.countDocuments({
            doctorId,
            status: "busy",
        });
        res.json({
            total,
            pending,
            accepted,
            rejected,
            busy,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê lịch làm việc", error });
    }
});
exports.getScheduleStats = getScheduleStats;
