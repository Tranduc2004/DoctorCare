import mongoose from "mongoose";

export async function connectMongo() {
  // Fail-fast nếu quên connect
  mongoose.set("bufferCommands", false);

  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  console.log("✅ MongoDB connected successfully");
  return mongoose.connection;
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getConnection() {
  return mongoose.connection;
}
