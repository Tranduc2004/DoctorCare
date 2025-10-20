import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo, isConnected } from "./db/mongo";
import medicineRoutes from "./routes/medicineRoutes";
import authRoutes from "./routes/authRoutes";
import staffRoutes from "./routes/staffRoutes";
import categoryRoutes from "./routes/categoryRoutes";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      process.env.MAIN_SERVER_URL || "http://localhost:5000",
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:2000", // Add pharmacy frontend
      "http://localhost:4000", // Add admin panel
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add explicitly allowed methods
    allowedHeaders: ["Content-Type", "Authorization", "x-internal-token"], // Add internal token header
  })
);

// Database connection check middleware
app.use((_req, res, next) => {
  if (!isConnected()) {
    return res.status(503).json({
      success: false,
      error: "DB_NOT_CONNECTED",
      message: "Database connection not available",
    });
  }
  return next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/categories", categoryRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    dbConnected: isConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to MongoDB using new connection manager
    await connectMongo();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Pharmacy service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
