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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Admin_1 = __importDefault(require("../modules/admin/models/Admin"));
dotenv_1.default.config();
const createAdminAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("Kết nối MongoDB thành công!");
        // Check if admin already exists
        const existingAdmin = yield Admin_1.default.findOne({ username: "admin" });
        if (existingAdmin) {
            console.log("Tài khoản admin đã tồn tại!");
            process.exit(0);
        }
        // Create admin account
        const adminData = {
            username: "admin",
            email: "admin@hospital.com",
            password: "admin123",
            role: "admin",
        };
        const admin = new Admin_1.default(adminData);
        yield admin.save();
        console.log("✅ Tài khoản admin đã được tạo thành công!");
        console.log("Username: admin");
        console.log("Password: admin123");
        console.log("Email: admin@hospital.com");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Lỗi khi tạo tài khoản admin:", error);
        process.exit(1);
    }
});
createAdminAccount();
