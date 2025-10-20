import dotenv from "dotenv";
dotenv.config();
import Staff from "../models/Staff";
import { connectDatabase } from "../config/database";

const createSampleStaff = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log("Connected to database");

    // Clear existing staff
    await Staff.deleteMany({});
    console.log("Cleared existing staff");

    // Create sample staff
    const sampleStaff = [
      {
        name: "Nguyễn Văn A",
        email: "admin@pharmacy.com",
        password: "123456",
        role: "admin",
        active: true,
        status: "approved",
      },
      {
        name: "Trần Thị B",
        email: "staff1@pharmacy.com",
        password: "123456",
        role: "staff",
        active: true,
        status: "approved",
      },
      {
        name: "Lê Văn C",
        email: "staff2@pharmacy.com",
        password: "123456",
        role: "staff",
        active: false,
        status: "rejected",
        rejectedReason: "Không đủ kinh nghiệm",
      },
      {
        name: "Phạm Thị D",
        email: "staff3@pharmacy.com",
        password: "123456",
        role: "staff",
        active: true,
        status: "pending",
      },
      {
        name: "Hoàng Văn E",
        email: "staff4@pharmacy.com",
        password: "123456",
        role: "staff",
        active: true,
        status: "pending",
      },
    ];

    for (const staffData of sampleStaff) {
      const staff = new Staff(staffData);
      await staff.save();
      console.log(`Created staff: ${staffData.name} (${staffData.email})`);
    }

    console.log("Sample staff created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating sample staff:", error);
    process.exit(1);
  }
};

createSampleStaff();
