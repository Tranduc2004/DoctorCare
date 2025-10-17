import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import medicineRoutes from "./routes/medicineRoutes";
import authRoutes from "./routes/authRoutes";

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
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add explicitly allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Add explicitly allowed headers
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Pharmacy service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
