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
exports.getActiveSpecialties = exports.searchSpecialties = exports.hardDeleteSpecialty = exports.deleteSpecialty = exports.updateSpecialty = exports.createSpecialty = exports.getSpecialtyById = exports.getAllSpecialties = void 0;
const specialtyService_1 = __importDefault(require("../services/specialtyService"));
const cloudinary_1 = require("../../../shared/utils/cloudinary");
// Lấy tất cả chuyên khoa
const getAllSpecialties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const specialties = yield specialtyService_1.default.getAllSpecialties();
        res.json({
            success: true,
            data: specialties,
            message: "Lấy danh sách chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error getting specialties:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách chuyên khoa",
        });
    }
});
exports.getAllSpecialties = getAllSpecialties;
// Lấy chuyên khoa theo ID
const getSpecialtyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const specialty = yield specialtyService_1.default.getSpecialtyById(id);
        if (!specialty) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy chuyên khoa",
            });
            return;
        }
        res.json({
            success: true,
            data: specialty,
            message: "Lấy thông tin chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error getting specialty by id:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy thông tin chuyên khoa",
        });
    }
});
exports.getSpecialtyById = getSpecialtyById;
// Tạo chuyên khoa mới
const createSpecialty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        // Validation
        if (!name || !description) {
            res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin",
            });
            return;
        }
        // Kiểm tra chuyên khoa đã tồn tại
        const exists = yield specialtyService_1.default.checkSpecialtyExists(name);
        if (exists) {
            res.status(400).json({
                success: false,
                message: "Chuyên khoa đã tồn tại",
            });
            return;
        }
        const specialtyData = {
            name: name.trim(),
            description: description.trim(),
        };
        const newSpecialty = yield specialtyService_1.default.createSpecialty(specialtyData);
        // Upload ảnh nếu có
        let imageData = null;
        if (req.file) {
            try {
                imageData = yield (0, cloudinary_1.uploadSpecialtyImage)(req.file.path, newSpecialty._id);
                // Cập nhật specialty với thông tin ảnh
                yield specialtyService_1.default.updateSpecialty(newSpecialty._id, {
                    imageUrl: imageData.url,
                    imagePublicId: imageData.public_id,
                    thumbnailUrl: imageData.thumbnail_url,
                });
            }
            catch (imageError) {
                console.error("Error uploading specialty image:", imageError);
                // Không return error, vì specialty đã được tạo thành công
            }
        }
        // Lấy specialty với thông tin ảnh đã cập nhật
        const updatedSpecialty = yield specialtyService_1.default.getSpecialtyById(newSpecialty._id);
        res.status(201).json({
            success: true,
            data: updatedSpecialty,
            message: "Tạo chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error creating specialty:", error);
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Tên chuyên khoa đã tồn tại",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo chuyên khoa",
        });
    }
});
exports.createSpecialty = createSpecialty;
// Cập nhật chuyên khoa
const updateSpecialty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validation
        if (updateData.name && updateData.name.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Tên chuyên khoa không được để trống",
            });
            return;
        }
        // Kiểm tra chuyên khoa đã tồn tại (nếu thay đổi tên)
        if (updateData.name) {
            const exists = yield specialtyService_1.default.checkSpecialtyExists(updateData.name, id);
            if (exists) {
                res.status(400).json({
                    success: false,
                    message: "Tên chuyên khoa đã tồn tại",
                });
                return;
            }
        }
        // Lấy specialty hiện tại để kiểm tra ảnh cũ
        const currentSpecialty = yield specialtyService_1.default.getSpecialtyById(id);
        if (!currentSpecialty) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy chuyên khoa",
            });
            return;
        }
        // Xử lý upload ảnh mới
        if (req.file) {
            try {
                // Xóa ảnh cũ nếu có
                if (currentSpecialty.imagePublicId) {
                    yield (0, cloudinary_1.deleteImageByPublicId)(currentSpecialty.imagePublicId);
                }
                // Upload ảnh mới
                const imageData = yield (0, cloudinary_1.uploadSpecialtyImage)(req.file.path, id);
                updateData.imageUrl = imageData.url;
                updateData.imagePublicId = imageData.public_id;
                updateData.thumbnailUrl = imageData.thumbnail_url;
            }
            catch (imageError) {
                console.error("Error uploading specialty image:", imageError);
                // Tiếp tục update các trường khác
            }
        }
        const updatedSpecialty = yield specialtyService_1.default.updateSpecialty(id, updateData);
        if (!updatedSpecialty) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy chuyên khoa",
            });
            return;
        }
        res.json({
            success: true,
            data: updatedSpecialty,
            message: "Cập nhật chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error updating specialty:", error);
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Tên chuyên khoa đã tồn tại",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Lỗi server khi cập nhật chuyên khoa",
        });
    }
});
exports.updateSpecialty = updateSpecialty;
// Xóa chuyên khoa (soft delete)
const deleteSpecialty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedSpecialty = yield specialtyService_1.default.deleteSpecialty(id);
        if (!deletedSpecialty) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy chuyên khoa",
            });
            return;
        }
        res.json({
            success: true,
            message: "Xóa chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error deleting specialty:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa chuyên khoa",
        });
    }
});
exports.deleteSpecialty = deleteSpecialty;
// Xóa hoàn toàn chuyên khoa
const hardDeleteSpecialty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Lấy thông tin specialty để xóa ảnh
        const specialty = yield specialtyService_1.default.getSpecialtyById(id);
        if (specialty && specialty.imagePublicId) {
            try {
                yield (0, cloudinary_1.deleteImageByPublicId)(specialty.imagePublicId);
            }
            catch (imageError) {
                console.error("Error deleting specialty image:", imageError);
            }
        }
        const isDeleted = yield specialtyService_1.default.hardDeleteSpecialty(id);
        if (!isDeleted) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy chuyên khoa",
            });
            return;
        }
        res.json({
            success: true,
            message: "Xóa hoàn toàn chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error hard deleting specialty:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa chuyên khoa",
        });
    }
});
exports.hardDeleteSpecialty = hardDeleteSpecialty;
// Tìm kiếm chuyên khoa
const searchSpecialties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q } = req.query;
        if (!q || typeof q !== "string") {
            res.status(400).json({
                success: false,
                message: "Vui lòng nhập từ khóa tìm kiếm",
            });
            return;
        }
        const specialties = yield specialtyService_1.default.searchSpecialties(q);
        res.json({
            success: true,
            data: specialties,
            message: "Tìm kiếm chuyên khoa thành công",
        });
    }
    catch (error) {
        console.error("Error searching specialties:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi tìm kiếm chuyên khoa",
        });
    }
});
exports.searchSpecialties = searchSpecialties;
// Lấy chuyên khoa đang hoạt động
const getActiveSpecialties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const specialties = yield specialtyService_1.default.getActiveSpecialties();
        res.json({
            success: true,
            data: specialties,
            message: "Lấy danh sách chuyên khoa đang hoạt động thành công",
        });
    }
    catch (error) {
        console.error("Error getting active specialties:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách chuyên khoa đang hoạt động",
        });
    }
});
exports.getActiveSpecialties = getActiveSpecialties;
