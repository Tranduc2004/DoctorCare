"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Configure Multer for storing service and specialty images
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueId = (0, uuid_1.v4)();
        const extension = path_1.default.extname(file.originalname);
        cb(null, Date.now() + "-" + uniqueId + extension);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Allow only images
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    },
});
exports.uploadSingle = upload.single("image");
