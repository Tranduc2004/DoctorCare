import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Import modules
import adminRoutes from "./modules/admin/routes";
import patientRoutes from "./modules/patient/routes";
import doctorRoutes from "./modules/doctor/routes";
import { specialtyRoutes, authRoutes } from "./modules/shared/routes";
import { verifyEmailTransport } from "./shared/utils";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes - Mỗi module có auth riêng
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);

// Shared routes (công khai)
app.use("/api/specialties", specialtyRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
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

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(async () => {
    console.log("Kết nối MongoDB thành công!");

    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
      console.log(`Admin Auth: http://localhost:${PORT}/api/admin/auth`);
      console.log(`Patient Auth: http://localhost:${PORT}/api/patient/auth`);
      console.log(`Doctor Auth: http://localhost:${PORT}/api/doctor/auth`);
      console.log(`Shared Auth: http://localhost:${PORT}/api/auth`);
    });

    // Kiểm tra mailer (không chặn server nếu lỗi)
    verifyEmailTransport().catch(() => {});
  })
  .catch((err: any) => console.error("Lỗi kết nối MongoDB:", err));
