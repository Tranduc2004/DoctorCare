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
exports.deleteImageByPublicId = exports.deleteSpecialtyImage = exports.deleteServiceImage = exports.uploadSpecialtyImage = exports.uploadServiceImage = exports.getDocumentType = exports.isAllowedDocumentType = exports.getMedicalRecordDocuments = exports.deleteMedicalRecordDocuments = exports.deleteMedicalRecordDocument = exports.uploadMultipleMedicalRecordDocuments = exports.uploadMedicalRecordDocument = exports.getMedicalRecordImages = exports.deleteMedicalRecordImages = exports.uploadMultipleMedicalRecordImages = exports.uploadMedicalRecordImage = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Cấu hình cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (filePath_1, ...args_1) => __awaiter(void 0, [filePath_1, ...args_1], void 0, function* (filePath, folder = "general") {
    try {
        // Upload file lên cloudinary
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `medicare/${folder}`, // Tên thư mục trên cloudinary
            resource_type: "auto", // Tự động phát hiện loại file
        });
        // Xóa file tạm sau khi upload
        fs_1.default.unlinkSync(filePath);
        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    }
    catch (error) {
        // Xóa file tạm nếu upload thất bại
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        console.error("Cloudinary upload error:", error);
        throw error;
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = (public_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield cloudinary_1.v2.uploader.destroy(public_id);
    }
    catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
// Chức năng upload ảnh cho hồ sơ bệnh án
const uploadMedicalRecordImage = (filePath_1, medicalRecordId_1, ...args_1) => __awaiter(void 0, [filePath_1, medicalRecordId_1, ...args_1], void 0, function* (filePath, medicalRecordId, imageType = "document") {
    try {
        // Upload ảnh gốc với tối ưu hóa
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `medicare/medical-records/${medicalRecordId}/${imageType}`,
            resource_type: "image",
            transformation: [
                { quality: "auto:good" }, // Tự động tối ưu chất lượng
                { fetch_format: "auto" }, // Tự động chọn format tốt nhất
                { width: 1920, height: 1080, crop: "limit" }, // Giới hạn kích thước tối đa
            ],
            tags: [`medical_record_${medicalRecordId}`, `type_${imageType}`], // Thêm tags để dễ quản lý
        });
        // Tạo thumbnail cho ảnh
        const thumbnailUrl = cloudinary_1.v2.url(result.public_id, {
            transformation: [
                { width: 300, height: 300, crop: "fill", gravity: "center" },
                { quality: "auto:low" },
                { fetch_format: "auto" },
            ],
        });
        // Xóa file tạm sau khi upload
        fs_1.default.unlinkSync(filePath);
        return {
            url: result.secure_url,
            public_id: result.public_id,
            thumbnail_url: thumbnailUrl,
        };
    }
    catch (error) {
        // Xóa file tạm nếu upload thất bại
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        console.error("Medical record image upload error:", error);
        throw error;
    }
});
exports.uploadMedicalRecordImage = uploadMedicalRecordImage;
// Upload nhiều ảnh cho hồ sơ bệnh án
const uploadMultipleMedicalRecordImages = (filePaths_1, medicalRecordId_1, ...args_1) => __awaiter(void 0, [filePaths_1, medicalRecordId_1, ...args_1], void 0, function* (filePaths, medicalRecordId, imageType = "document") {
    try {
        const uploadPromises = filePaths.map((filePath, index) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, exports.uploadMedicalRecordImage)(filePath, medicalRecordId, imageType);
            return Object.assign(Object.assign({}, result), { originalName: `${imageType}_${index + 1}` });
        }));
        return yield Promise.all(uploadPromises);
    }
    catch (error) {
        console.error("Multiple medical record images upload error:", error);
        throw error;
    }
});
exports.uploadMultipleMedicalRecordImages = uploadMultipleMedicalRecordImages;
// Xóa tất cả ảnh của một hồ sơ bệnh án
const deleteMedicalRecordImages = (medicalRecordId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Tìm tất cả ảnh có tag medical_record_id
        const searchResult = yield cloudinary_1.v2.search
            .expression(`tags:medical_record_${medicalRecordId}`)
            .execute();
        if (searchResult.resources && searchResult.resources.length > 0) {
            const publicIds = searchResult.resources.map((resource) => resource.public_id);
            // Xóa tất cả ảnh
            yield cloudinary_1.v2.api.delete_resources(publicIds);
            console.log(`Deleted ${publicIds.length} images for medical record ${medicalRecordId}`);
        }
    }
    catch (error) {
        console.error("Delete medical record images error:", error);
        throw error;
    }
});
exports.deleteMedicalRecordImages = deleteMedicalRecordImages;
// Lấy danh sách ảnh của hồ sơ bệnh án
const getMedicalRecordImages = (medicalRecordId, imageType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let searchExpression = `tags:medical_record_${medicalRecordId}`;
        if (imageType) {
            searchExpression += ` AND tags:type_${imageType}`;
        }
        const searchResult = yield cloudinary_1.v2.search
            .expression(searchExpression)
            .sort_by("created_at", "desc")
            .max_results(100)
            .execute();
        if (searchResult.resources) {
            return searchResult.resources.map((resource) => {
                var _a;
                // Tạo thumbnail URL
                const thumbnailUrl = cloudinary_1.v2.url(resource.public_id, {
                    transformation: [
                        { width: 300, height: 300, crop: "fill", gravity: "center" },
                        { quality: "auto:low" },
                        { fetch_format: "auto" },
                    ],
                });
                // Lấy loại ảnh từ tags
                const typeTag = (_a = resource.tags) === null || _a === void 0 ? void 0 : _a.find((tag) => tag.startsWith("type_"));
                const type = typeTag ? typeTag.replace("type_", "") : "unknown";
                return {
                    url: resource.secure_url,
                    public_id: resource.public_id,
                    thumbnail_url: thumbnailUrl,
                    created_at: resource.created_at,
                    type: type,
                };
            });
        }
        return [];
    }
    catch (error) {
        console.error("Get medical record images error:", error);
        throw error;
    }
});
exports.getMedicalRecordImages = getMedicalRecordImages;
// ==================== CHỨC NĂNG UPLOAD TÀI LIỆU HỒ SƠ BỆNH ÁN ====================
// Upload tài liệu cho hồ sơ bệnh án (PDF, Word, Excel, v.v.)
const uploadMedicalRecordDocument = (filePath_1, medicalRecordId_1, originalName_1, ...args_1) => __awaiter(void 0, [filePath_1, medicalRecordId_1, originalName_1, ...args_1], void 0, function* (filePath, medicalRecordId, originalName, documentType = "other") {
    try {
        // Tạo thư mục uploads nếu chưa tồn tại
        const uploadsDir = path_1.default.join(process.cwd(), "uploads", "medical-records", medicalRecordId);
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        // Tạo tên file unique với timestamp
        const fileExtension = path_1.default.extname(originalName);
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000000);
        const fileName = `${timestamp}-${randomNum}${fileExtension}`;
        const destinationPath = path_1.default.join(uploadsDir, fileName);
        // Copy file từ temp location đến uploads folder
        fs_1.default.copyFileSync(filePath, destinationPath);
        // Lấy thông tin file
        const stats = fs_1.default.statSync(destinationPath);
        const fileSize = stats.size;
        // Xóa file tạm
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Tạo URL để truy cập file
        const fileUrl = `/uploads/medical-records/${medicalRecordId}/${fileName}`;
        return {
            url: fileUrl,
            fileName: fileName,
            originalName: originalName,
            size: fileSize,
        };
    }
    catch (error) {
        // Xóa file tạm nếu upload thất bại
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        console.error("Medical record document upload error:", error);
        throw error;
    }
});
exports.uploadMedicalRecordDocument = uploadMedicalRecordDocument;
// Upload nhiều tài liệu cho hồ sơ bệnh án
const uploadMultipleMedicalRecordDocuments = (files, medicalRecordId) => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    for (const file of files) {
        try {
            const result = yield (0, exports.uploadMedicalRecordDocument)(file.filePath, medicalRecordId, file.originalName, file.documentType || "other");
            results.push(result);
        }
        catch (error) {
            console.error(`Error uploading ${file.originalName}:`, error);
            results.push({
                url: "",
                fileName: "",
                originalName: file.originalName,
                size: 0,
                error: error instanceof Error ? error.message : "Upload failed",
            });
        }
    }
    return results;
});
exports.uploadMultipleMedicalRecordDocuments = uploadMultipleMedicalRecordDocuments;
// Xóa tài liệu hồ sơ bệnh án
const deleteMedicalRecordDocument = (medicalRecordId, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filePath = path_1.default.join(process.cwd(), "uploads", "medical-records", medicalRecordId, fileName);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log(`Deleted document: ${fileName} for medical record: ${medicalRecordId}`);
        }
        else {
            console.warn(`Document not found: ${fileName} for medical record: ${medicalRecordId}`);
        }
    }
    catch (error) {
        console.error("Error deleting medical record document:", error);
        throw error;
    }
});
exports.deleteMedicalRecordDocument = deleteMedicalRecordDocument;
// Xóa tất cả tài liệu của hồ sơ bệnh án
const deleteMedicalRecordDocuments = (medicalRecordId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentsDir = path_1.default.join(process.cwd(), "uploads", "medical-records", medicalRecordId);
        if (fs_1.default.existsSync(documentsDir)) {
            const files = fs_1.default.readdirSync(documentsDir);
            // Xóa từng file
            for (const file of files) {
                const filePath = path_1.default.join(documentsDir, file);
                fs_1.default.unlinkSync(filePath);
            }
            // Xóa thư mục nếu rỗng
            fs_1.default.rmdirSync(documentsDir);
            console.log(`Deleted all documents for medical record: ${medicalRecordId}`);
        }
    }
    catch (error) {
        console.error("Error deleting medical record documents:", error);
        throw error;
    }
});
exports.deleteMedicalRecordDocuments = deleteMedicalRecordDocuments;
// Lấy danh sách tài liệu của hồ sơ bệnh án
const getMedicalRecordDocuments = (medicalRecordId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentsDir = path_1.default.join(process.cwd(), "uploads", "medical-records", medicalRecordId);
        if (!fs_1.default.existsSync(documentsDir)) {
            return [];
        }
        const files = fs_1.default.readdirSync(documentsDir);
        const documents = [];
        for (const fileName of files) {
            const filePath = path_1.default.join(documentsDir, fileName);
            const stats = fs_1.default.statSync(filePath);
            // Tách timestamp từ tên file để lấy tên gốc
            const parts = fileName.split("-");
            const timestamp = parts[0];
            const extension = path_1.default.extname(fileName);
            const originalName = fileName
                .replace(`${timestamp}-${parts[1]}`, "")
                .replace(extension, "") + extension;
            documents.push({
                url: `/uploads/medical-records/${medicalRecordId}/${fileName}`,
                fileName: fileName,
                originalName: originalName || fileName,
                size: stats.size,
                uploadedAt: stats.birthtime,
                extension: extension.toLowerCase(),
            });
        }
        // Sắp xếp theo thời gian upload (mới nhất trước)
        documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
        return documents;
    }
    catch (error) {
        console.error("Error getting medical record documents:", error);
        throw error;
    }
});
exports.getMedicalRecordDocuments = getMedicalRecordDocuments;
// Kiểm tra loại file có được phép upload không
const isAllowedDocumentType = (fileName) => {
    const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".txt",
        ".rtf",
        ".csv",
        ".zip",
        ".rar",
        ".7z",
    ];
    const extension = path_1.default.extname(fileName).toLowerCase();
    return allowedExtensions.includes(extension);
};
exports.isAllowedDocumentType = isAllowedDocumentType;
// Lấy loại tài liệu dựa trên extension
const getDocumentType = (fileName) => {
    const extension = path_1.default.extname(fileName).toLowerCase();
    if (extension === ".pdf")
        return "pdf";
    if ([".doc", ".docx"].includes(extension))
        return "word";
    if ([".xls", ".xlsx"].includes(extension))
        return "excel";
    if ([".txt", ".rtf"].includes(extension))
        return "text";
    return "other";
};
exports.getDocumentType = getDocumentType;
// ==================== CHỨC NĂNG UPLOAD ẢNH CHO SERVICES VÀ SPECIALTIES ====================
// Upload ảnh cho dịch vụ
const uploadServiceImage = (filePath, serviceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Upload ảnh gốc với tối ưu hóa
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `medicare/services/${serviceId}`,
            resource_type: "image",
            transformation: [
                { quality: "auto:good" },
                { fetch_format: "auto" },
                { width: 800, height: 600, crop: "limit" },
            ],
            tags: [`service_${serviceId}`, "service_image"],
        });
        // Tạo thumbnail cho ảnh
        const thumbnailUrl = cloudinary_1.v2.url(result.public_id, {
            transformation: [
                { width: 300, height: 200, crop: "fill", gravity: "center" },
                { quality: "auto:low" },
                { fetch_format: "auto" },
            ],
        });
        // Xóa file tạm sau khi upload
        fs_1.default.unlinkSync(filePath);
        return {
            url: result.secure_url,
            public_id: result.public_id,
            thumbnail_url: thumbnailUrl,
        };
    }
    catch (error) {
        // Xóa file tạm nếu upload thất bại
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        console.error("Service image upload error:", error);
        throw error;
    }
});
exports.uploadServiceImage = uploadServiceImage;
// Upload ảnh cho chuyên khoa
const uploadSpecialtyImage = (filePath, specialtyId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Upload ảnh gốc với tối ưu hóa
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `medicare/specialties/${specialtyId}`,
            resource_type: "image",
            transformation: [
                { quality: "auto:good" },
                { fetch_format: "auto" },
                { width: 800, height: 600, crop: "limit" },
            ],
            tags: [`specialty_${specialtyId}`, "specialty_image"],
        });
        // Tạo thumbnail cho ảnh
        const thumbnailUrl = cloudinary_1.v2.url(result.public_id, {
            transformation: [
                { width: 300, height: 200, crop: "fill", gravity: "center" },
                { quality: "auto:low" },
                { fetch_format: "auto" },
            ],
        });
        // Xóa file tạm sau khi upload
        fs_1.default.unlinkSync(filePath);
        return {
            url: result.secure_url,
            public_id: result.public_id,
            thumbnail_url: thumbnailUrl,
        };
    }
    catch (error) {
        // Xóa file tạm nếu upload thất bại
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        console.error("Specialty image upload error:", error);
        throw error;
    }
});
exports.uploadSpecialtyImage = uploadSpecialtyImage;
// Xóa ảnh dịch vụ
const deleteServiceImage = (serviceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Tìm tất cả ảnh có tag service_id
        const searchResult = yield cloudinary_1.v2.search
            .expression(`tags:service_${serviceId}`)
            .execute();
        if (searchResult.resources && searchResult.resources.length > 0) {
            const publicIds = searchResult.resources.map((resource) => resource.public_id);
            yield cloudinary_1.v2.api.delete_resources(publicIds);
        }
    }
    catch (error) {
        console.error("Delete service image error:", error);
        throw error;
    }
});
exports.deleteServiceImage = deleteServiceImage;
// Xóa ảnh chuyên khoa
const deleteSpecialtyImage = (specialtyId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Tìm tất cả ảnh có tag specialty_id
        const searchResult = yield cloudinary_1.v2.search
            .expression(`tags:specialty_${specialtyId}`)
            .execute();
        if (searchResult.resources && searchResult.resources.length > 0) {
            const publicIds = searchResult.resources.map((resource) => resource.public_id);
            yield cloudinary_1.v2.api.delete_resources(publicIds);
        }
    }
    catch (error) {
        console.error("Delete specialty image error:", error);
        throw error;
    }
});
exports.deleteSpecialtyImage = deleteSpecialtyImage;
// Xóa ảnh dựa trên public_id (dùng khi update ảnh mới)
const deleteImageByPublicId = (public_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield cloudinary_1.v2.uploader.destroy(public_id);
    }
    catch (error) {
        console.error("Delete image by public_id error:", error);
        throw error;
    }
});
exports.deleteImageByPublicId = deleteImageByPublicId;
exports.default = cloudinary_1.v2;
