import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../modules/admin/models/Admin";

dotenv.config();

const createAdminAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Kết nối MongoDB thành công!");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Tài khoản admin đã tồn tại!");
      process.exit(0);
    }

    // Create admin account
    const adminData = {
      username: "admin",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin" as const,
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log("✅ Tài khoản admin đã được tạo thành công!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@hospital.com");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi tạo tài khoản admin:", error);
    process.exit(1);
  }
};

createAdminAccount();
