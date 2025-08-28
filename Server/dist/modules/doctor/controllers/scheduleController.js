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
exports.getScheduleStats = exports.deleteSchedule = exports.updateSchedule = exports.getMySchedules = exports.getDoctorSchedules = exports.createSchedule = void 0;
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
// Doctor: Lấy lịch làm việc của bác sĩ
const getDoctorSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.params;
        const schedules = yield DoctorSchedule_1.default.find({ doctorId, isBooked: false })
            .sort({ date: 1, startTime: 1 })
            .lean();
        res.json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch", error });
    }
});
exports.getDoctorSchedules = getDoctorSchedules;
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
        const available = yield DoctorSchedule_1.default.countDocuments({
            doctorId,
            isBooked: false,
        });
        const booked = yield DoctorSchedule_1.default.countDocuments({
            doctorId,
            isBooked: true,
        });
        res.json({
            total,
            available,
            booked,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê lịch làm việc", error });
    }
});
exports.getScheduleStats = getScheduleStats;
