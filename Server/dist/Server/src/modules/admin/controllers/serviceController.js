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
exports.getActiveServices = exports.searchServices = exports.hardDeleteService = exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getAllServices = void 0;
const serviceService_1 = __importDefault(require("../services/serviceService"));
const cloudinary_1 = require("../../../shared/utils/cloudinary");
// Lấy tất cả dịch vụ
const getAllServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield serviceService_1.default.getAllServices();
        res.json({
            success: true,
            data: services,
            message: "Lấy danh sách dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error getting services:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách dịch vụ",
        });
    }
});
exports.getAllServices = getAllServices;
// Lấy dịch vụ theo ID
const getServiceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const service = yield serviceService_1.default.getServiceById(id);
        if (!service) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ",
            });
            return;
        }
        res.json({
            success: true,
            data: service,
            message: "Lấy thông tin dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error getting service by id:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy thông tin dịch vụ",
        });
    }
});
exports.getServiceById = getServiceById;
// Tạo dịch vụ mới
const createService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, duration } = req.body;
        // Validation
        if (!name || !description || !price || !duration) {
            res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin",
            });
            return;
        }
        if (price < 0) {
            res.status(400).json({
                success: false,
                message: "Giá dịch vụ không được âm",
            });
            return;
        }
        if (duration < 15) {
            res.status(400).json({
                success: false,
                message: "Thời gian khám tối thiểu là 15 phút",
            });
            return;
        }
        const serviceData = {
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            duration: Number(duration),
        };
        const newService = yield serviceService_1.default.createService(serviceData);
        // Upload ảnh nếu có
        let imageData = null;
        if (req.file) {
            try {
                imageData = yield (0, cloudinary_1.uploadServiceImage)(req.file.path, newService._id);
                // Cập nhật service với thông tin ảnh
                yield serviceService_1.default.updateService(newService._id, {
                    imageUrl: imageData.url,
                    imagePublicId: imageData.public_id,
                    thumbnailUrl: imageData.thumbnail_url,
                });
            }
            catch (imageError) {
                console.error("Error uploading service image:", imageError);
                // Không return error, vì service đã được tạo thành công
            }
        }
        // Lấy service với thông tin ảnh đã cập nhật
        const updatedService = yield serviceService_1.default.getServiceById(newService._id);
        res.status(201).json({
            success: true,
            data: updatedService,
            message: "Tạo dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error creating service:", error);
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Tên dịch vụ đã tồn tại",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo dịch vụ",
        });
    }
});
exports.createService = createService;
// Cập nhật dịch vụ
const updateService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validation
        if (updateData.price !== undefined && updateData.price < 0) {
            res.status(400).json({
                success: false,
                message: "Giá dịch vụ không được âm",
            });
            return;
        }
        if (updateData.duration !== undefined && updateData.duration < 15) {
            res.status(400).json({
                success: false,
                message: "Thời gian khám tối thiểu là 15 phút",
            });
            return;
        }
        // Lấy service hiện tại để kiểm tra ảnh cũ
        const currentService = yield serviceService_1.default.getServiceById(id);
        if (!currentService) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ",
            });
            return;
        }
        // Xử lý upload ảnh mới
        if (req.file) {
            try {
                // Xóa ảnh cũ nếu có
                if (currentService.imagePublicId) {
                    yield (0, cloudinary_1.deleteImageByPublicId)(currentService.imagePublicId);
                }
                // Upload ảnh mới
                const imageData = yield (0, cloudinary_1.uploadServiceImage)(req.file.path, id);
                updateData.imageUrl = imageData.url;
                updateData.imagePublicId = imageData.public_id;
                updateData.thumbnailUrl = imageData.thumbnail_url;
            }
            catch (imageError) {
                console.error("Error uploading service image:", imageError);
                // Tiếp tục update các trường khác
            }
        }
        const updatedService = yield serviceService_1.default.updateService(id, updateData);
        if (!updatedService) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ",
            });
            return;
        }
        res.json({
            success: true,
            data: updatedService,
            message: "Cập nhật dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error updating service:", error);
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Tên dịch vụ đã tồn tại",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Lỗi server khi cập nhật dịch vụ",
        });
    }
});
exports.updateService = updateService;
// Xóa dịch vụ (soft delete)
const deleteService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedService = yield serviceService_1.default.deleteService(id);
        if (!deletedService) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ",
            });
            return;
        }
        res.json({
            success: true,
            message: "Xóa dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa dịch vụ",
        });
    }
});
exports.deleteService = deleteService;
// Xóa hoàn toàn dịch vụ
const hardDeleteService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Lấy thông tin service để xóa ảnh
        const service = yield serviceService_1.default.getServiceById(id);
        if (service && service.imagePublicId) {
            try {
                yield (0, cloudinary_1.deleteImageByPublicId)(service.imagePublicId);
            }
            catch (imageError) {
                console.error("Error deleting service image:", imageError);
            }
        }
        const isDeleted = yield serviceService_1.default.hardDeleteService(id);
        if (!isDeleted) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ",
            });
            return;
        }
        res.json({
            success: true,
            message: "Xóa hoàn toàn dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error hard deleting service:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa dịch vụ",
        });
    }
});
exports.hardDeleteService = hardDeleteService;
// Tìm kiếm dịch vụ
const searchServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q } = req.query;
        if (!q || typeof q !== "string") {
            res.status(400).json({
                success: false,
                message: "Vui lòng nhập từ khóa tìm kiếm",
            });
            return;
        }
        const services = yield serviceService_1.default.searchServices(q);
        res.json({
            success: true,
            data: services,
            message: "Tìm kiếm dịch vụ thành công",
        });
    }
    catch (error) {
        console.error("Error searching services:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi tìm kiếm dịch vụ",
        });
    }
});
exports.searchServices = searchServices;
// Lấy dịch vụ đang hoạt động
const getActiveServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield serviceService_1.default.getActiveServices();
        res.json({
            success: true,
            data: services,
            message: "Lấy danh sách dịch vụ đang hoạt động thành công",
        });
    }
    catch (error) {
        console.error("Error getting active services:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách dịch vụ đang hoạt động",
        });
    }
});
exports.getActiveServices = getActiveServices;
