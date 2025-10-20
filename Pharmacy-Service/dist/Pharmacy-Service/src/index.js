"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongo_1 = require("./db/mongo");
const medicineRoutes_1 = __importDefault(require("./routes/medicineRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const staffRoutes_1 = __importDefault(require("./routes/staffRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        process.env.MAIN_SERVER_URL || "http://localhost:5000",
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:2000",
        "http://localhost:4000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-internal-token"],
}));
app.use((_req, res, next) => {
    if (!(0, mongo_1.isConnected)()) {
        return res.status(503).json({
            success: false,
            error: "DB_NOT_CONNECTED",
            message: "Database connection not available",
        });
    }
    return next();
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/medicines", medicineRoutes_1.default);
app.use("/api/staff", staffRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        dbConnected: (0, mongo_1.isConnected)(),
        timestamp: new Date().toISOString(),
    });
});
const PORT = process.env.PORT || 5001;
const startServer = async () => {
    try {
        await (0, mongo_1.connectMongo)();
        app.listen(PORT, () => {
            console.log(`Pharmacy service running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map