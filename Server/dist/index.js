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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Import modules
const routes_1 = __importDefault(require("./modules/admin/routes"));
const routes_2 = __importDefault(require("./modules/patient/routes"));
const routes_3 = __importDefault(require("./modules/doctor/routes"));
const routes_4 = require("./modules/shared/routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from uploads directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Routes - Mỗi module có auth riêng
app.use("/api/admin", routes_1.default);
app.use("/api/patient", routes_2.default);
app.use("/api/doctor", routes_3.default);
// Shared routes (công khai)
app.use("/api/specialties", routes_4.specialtyRoutes);
app.use("/api/auth", routes_4.authRoutes);
// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Kết nối MongoDB thành công!");
    app.listen(PORT, () => {
        console.log(`Server đang chạy tại http://localhost:${PORT}`);
        console.log(`Admin Auth: http://localhost:${PORT}/api/admin/auth`);
        console.log(`Patient Auth: http://localhost:${PORT}/api/patient/auth`);
        console.log(`Doctor Auth: http://localhost:${PORT}/api/doctor/auth`);
        console.log(`Shared Auth: http://localhost:${PORT}/api/auth`);
    });
}))
    .catch((err) => console.error("Lỗi kết nối MongoDB:", err));
