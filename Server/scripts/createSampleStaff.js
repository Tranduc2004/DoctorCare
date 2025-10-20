const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Simple staff schema for this script - matching the shared model
const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
    active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: String,
      ref: "Admin",
    },
    approvedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "staff",
  }
);

const createSampleStaff = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const Staff = mongoose.model("Staff", staffSchema);

    // Clear existing staff
    await Staff.deleteMany({});
    console.log("Cleared existing staff");

    // Create sample staff
    const sampleStaff = [
      {
        name: "Nguyễn Văn A",
        email: "admin@pharmacy.com",
        password:
          "$2a$12$LQv3c1yqBw5oYdI3Qm3Pwe/FQQPg5lPgCj5X5t5x5t5x5t5x5t5x5", // hashed "123456"
        role: "admin",
        active: true,
        status: "approved",
        approvedBy: "system",
        approvedAt: new Date(),
      },
      {
        name: "Trần Thị B",
        email: "staff1@pharmacy.com",
        password:
          "$2a$12$LQv3c1yqBw5oYdI3Qm3Pwe/FQQPg5lPgCj5X5t5x5t5x5t5x5t5x5", // hashed "123456"
        role: "staff",
        active: true,
        status: "approved",
        approvedBy: "system",
        approvedAt: new Date(),
      },
      {
        name: "Lê Văn C",
        email: "staff2@pharmacy.com",
        password:
          "$2a$12$LQv3c1yqBw5oYdI3Qm3Pwe/FQQPg5lPgCj5X5t5x5t5x5t5x5t5x5", // hashed "123456"
        role: "staff",
        active: false,
        status: "rejected",
        rejectedReason: "Không đủ kinh nghiệm",
      },
      {
        name: "Phạm Thị D",
        email: "staff3@pharmacy.com",
        password:
          "$2a$12$LQv3c1yqBw5oYdI3Qm3Pwe/FQQPg5lPgCj5X5t5x5t5x5t5x5t5x5", // hashed "123456"
        role: "staff",
        active: true,
        status: "pending",
      },
      {
        name: "Hoàng Văn E",
        email: "staff4@pharmacy.com",
        password:
          "$2a$12$LQv3c1yqBw5oYdI3Qm3Pwe/FQQPg5lPgCj5X5t5x5t5x5t5x5t5x5", // hashed "123456"
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
