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
exports.ServiceService = void 0;
const Service_1 = __importDefault(require("../models/Service"));
class ServiceService {
    // Lấy tất cả dịch vụ
    getAllServices() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Service_1.default.find().sort({ createdAt: -1 });
        });
    }
    // Lấy dịch vụ theo ID
    getServiceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Service_1.default.findById(id);
        });
    }
    // Tạo dịch vụ mới
    createService(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new Service_1.default(data);
            return yield service.save();
        });
    }
    // Cập nhật dịch vụ
    updateService(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Service_1.default.findByIdAndUpdate(id, Object.assign({}, data), { new: true, runValidators: true });
        });
    }
    // Xóa dịch vụ (soft delete)
    deleteService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Service_1.default.findByIdAndUpdate(id, { isActive: false }, { new: true });
        });
    }
    // Xóa hoàn toàn dịch vụ
    hardDeleteService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield Service_1.default.findByIdAndDelete(id);
            return !!result;
        });
    }
    // Tìm kiếm dịch vụ
    searchServices(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Service_1.default.find({
                $text: { $search: query },
                isActive: true
            }).sort({ score: { $meta: "textScore" } });
        });
    }
    // Lấy dịch vụ đang hoạt động
    getActiveServices() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Service_1.default.find({ isActive: true }).sort({ name: 1 });
        });
    }
}
exports.ServiceService = ServiceService;
exports.default = new ServiceService();
