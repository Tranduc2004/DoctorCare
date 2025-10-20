const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const updateStaffStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update all staff records to add status field if missing
    const result = await mongoose.connection.db.collection("staffs").updateMany(
      { status: { $exists: false } }, // Only update records without status
      {
        $set: {
          status: "approved",
          approvedBy: "system",
          approvedAt: new Date(),
        },
      }
    );

    console.log(
      `Updated ${result.modifiedCount} staff records with status field`
    );

    // Check current data
    const staffs = await mongoose.connection.db
      .collection("staffs")
      .find({})
      .toArray();
    console.log(`Total staff records: ${staffs.length}`);

    if (staffs.length > 0) {
      console.log("Sample record:");
      console.log(JSON.stringify(staffs[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateStaffStatus();
