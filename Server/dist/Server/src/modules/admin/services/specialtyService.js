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
exports.SpecialtyService = void 0;
const Specialty_1 = __importDefault(require("../models/Specialty"));
class SpecialtyService {
    // Lấy tất cả chuyên khoa
    getAllSpecialties() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Specialty_1.default.find().sort({ createdAt: -1 });
        });
    }
    // Lấy chuyên khoa theo ID
    getSpecialtyById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Specialty_1.default.findById(id);
        });
    }
    // Tạo chuyên khoa mới
    createSpecialty(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const specialty = new Specialty_1.default(data);
            return yield specialty.save();
        });
    }
    // Cập nhật chuyên khoa
    updateSpecialty(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Specialty_1.default.findByIdAndUpdate(id, Object.assign({}, data), { new: true, runValidators: true });
        });
    }
    // Xóa chuyên khoa (soft delete)
    deleteSpecialty(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Specialty_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
        });
    }
    // Xóa hoàn toàn chuyên khoa
    hardDeleteSpecialty(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield Specialty_1.default.findByIdAndDelete(id);
            return !!result;
        });
    }
    // Tìm kiếm chuyên khoa
    searchSpecialties(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Specialty_1.default.find({
                $text: { $search: query },
                isActive: true,
            }).sort({ score: { $meta: "textScore" } });
        });
    }
    // Lấy chuyên khoa đang hoạt động
    getActiveSpecialties() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Specialty_1.default.find({ isActive: true }).sort({ name: 1 });
        });
    }
    // Kiểm tra chuyên khoa có tồn tại không
    checkSpecialtyExists(name, excludeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { name: { $regex: new RegExp(`^${name}$`, "i") } };
            if (excludeId) {
                query._id = { $ne: excludeId };
            }
            const existing = yield Specialty_1.default.findOne(query);
            return !!existing;
        });
    }
}
exports.SpecialtyService = SpecialtyService;
exports.default = new SpecialtyService();
