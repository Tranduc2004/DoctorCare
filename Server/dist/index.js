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
const http_1 = __importDefault(require("http"));
// Configure dotenv FIRST, before any other imports that might use env vars
// Look for .env file in the project root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
// Debug: Log if env file is loaded
console.log("ENV file path:", path_1.default.resolve(__dirname, "../.env"));
console.log("EMAIL_USER from env:", process.env.EMAIL_USER);
console.log("EMAIL_PASS configured:", !!process.env.EMAIL_PASS);
const socket_1 = require("./utils/socket");
const markExpiredInvoices_1 = require("./utils/markExpiredInvoices");
// Import modules
const routes_1 = __importDefault(require("./modules/admin/routes"));
const routes_2 = __importDefault(require("./modules/patient/routes"));
const routes_3 = __importDefault(require("./modules/doctor/routes"));
const routes_4 = require("./modules/shared/routes");
const pricingRoutes_1 = __importDefault(require("./modules/pricing/routes/pricingRoutes"));
const utils_1 = require("./shared/utils");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
// Capture raw body for webhook signature verification (e.g., PayOS)
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        try {
            req.rawBody = buf.toString();
        }
        catch (_a) { }
    },
}));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from uploads directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Routes - Mỗi module có auth riêng
app.use("/api/admin", routes_1.default);
app.use("/api/patient", routes_2.default);
// Alias: also expose patient routes without the /api prefix for compatibility
// with external services configured to call /patient/... (e.g., PayOS webhook)
app.use("/patient", routes_2.default);
app.use("/api/doctor", routes_3.default);
// Shared routes (công khai)
app.use("/api/specialties", routes_4.specialtyRoutes);
app.use("/api/services", routes_4.serviceRoutes);
app.use("/api/auth", routes_4.authRoutes);
app.use("/api/messages", routes_4.messageRoutes);
// Notifications
const notifications_1 = __importDefault(require("./modules/shared/routes/notifications"));
app.use("/api/notifications", notifications_1.default);
app.use("/api/pricing", pricingRoutes_1.default);
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
    .connect(process.env.MONGODB_URI)
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    console.log("Kết nối MongoDB thành công!");
    server.listen(PORT, () => {
        console.log(`Server đang chạy tại http://localhost:${PORT}`);
        console.log(`Admin Auth: http://localhost:${PORT}/api/admin/auth`);
        console.log(`Patient Auth: http://localhost:${PORT}/api/patient/auth`);
        console.log(`Doctor Auth: http://localhost:${PORT}/api/doctor/auth`);
        console.log(`Shared Auth: http://localhost:${PORT}/api/auth`);
    });
    // initialize socket.io
    try {
        (0, socket_1.initSocket)(server);
        console.log("Socket.IO initialized");
    }
    catch (err) {
        console.error("Socket init failed", err);
    }
    // Start background monitor to mark expired invoices and release holds
    try {
        (0, markExpiredInvoices_1.startExpiredInvoiceMonitor)();
    }
    catch (e) {
        console.error("Failed to start expired invoice monitor", e);
    }
    // Kiểm tra mailer (không chặn server nếu lỗi)
    (0, utils_1.verifyEmailTransport)().catch(() => { });
}))
    .catch((err) => console.error("Lỗi kết nối MongoDB:", err));
