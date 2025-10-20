import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${process.env.MONGODB_URI}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
