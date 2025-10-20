import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";

// Configure dotenv FIRST, before any other imports that might use env vars
// Look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Debug: Log if env file is loaded
console.log("ENV file path:", path.resolve(__dirname, "../.env"));
console.log("EMAIL_USER from env:", process.env.EMAIL_USER);
console.log("EMAIL_PASS configured:", !!process.env.EMAIL_PASS);

import { initSocket } from "./utils/socket";
import { startExpiredInvoiceMonitor } from "./utils/markExpiredInvoices";
import { connectMongo, isConnected } from "./db/mongo";

// Import modules
import adminRoutes from "./modules/admin/routes";
import patientRoutes from "./modules/patient/routes";
import doctorRoutes from "./modules/doctor/routes";
import pharmacyRoutes from "./modules/pharmacy/routes";
import {
  specialtyRoutes,
  serviceRoutes,
  authRoutes,
  messageRoutes,
} from "./modules/shared/routes";
import pricingRoutes from "./modules/pricing/routes/pricingRoutes";
import { verifyEmailTransport } from "./shared/utils";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Body parsing middleware
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      // Store the raw body buffer for webhook signature verification
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Database connection check middleware
app.use((req, res, next) => {
  if (!isConnected()) {
    return res.status(503).json({
      success: false,
      error: "DB_NOT_CONNECTED",
      message: "Database connection not available",
    });
  }
  next();
});

// Routes - Mỗi module có auth riêng
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
// Alias: also expose patient routes without the /api prefix for compatibility
// with external services configured to call /patient/... (e.g., PayOS webhook)
app.use("/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/pharmacy", pharmacyRoutes);

// Shared routes (công khai)
app.use("/api/specialties", specialtyRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
// Notifications
import { default as notificationRoutes } from "./modules/shared/routes/notifications";
app.use("/api/notifications", notificationRoutes);
app.use("/api/pricing", pricingRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    dbConnected: isConnected(),
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectMongo();

    server.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
      console.log(`Admin Auth: http://localhost:${PORT}/api/admin/auth`);
      console.log(`Patient Auth: http://localhost:${PORT}/api/patient/auth`);
      console.log(`Doctor Auth: http://localhost:${PORT}/api/doctor/auth`);
      console.log(`Shared Auth: http://localhost:${PORT}/api/auth`);
    });

    // initialize socket.io
    try {
      initSocket(server);
      console.log("Socket.IO initialized");
    } catch (err) {
      console.error("Socket init failed", err);
    }

    // Start background monitor to mark expired invoices and release holds
    try {
      startExpiredInvoiceMonitor();
    } catch (e) {
      console.error("Failed to start expired invoice monitor", e);
    }

    // Kiểm tra mailer (không chặn server nếu lỗi)
    verifyEmailTransport().catch(() => {});
  } catch (err: any) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
