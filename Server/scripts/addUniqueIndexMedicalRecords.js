// Database migration script to add unique index on appointmentId
const mongoose = require("mongoose");
require("dotenv").config();

const addUniqueIndexToMedicalRecords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/medicare"
    );
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("medicalrecords");

    // Check if there are any duplicate appointmentIds
    const duplicates = await collection
      .aggregate([
        {
          $match: {
            appointmentId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$appointmentId",
            count: { $sum: 1 },
            docs: { $push: "$$ROOT" },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    if (duplicates.length > 0) {
      console.log("Found duplicate appointmentIds:");
      for (const duplicate of duplicates) {
        console.log(
          `AppointmentId: ${duplicate._id}, Count: ${duplicate.count}`
        );

        // Keep the first record, delete others
        const docsToDelete = duplicate.docs.slice(1);
        for (const doc of docsToDelete) {
          await collection.deleteOne({ _id: doc._id });
          console.log(`Deleted duplicate record: ${doc._id}`);
        }
      }
    } else {
      console.log("No duplicate appointmentIds found");
    }

    // Create unique sparse index on appointmentId
    try {
      await collection.createIndex(
        { appointmentId: 1 },
        { unique: true, sparse: true }
      );
      console.log("Successfully created unique sparse index on appointmentId");
    } catch (indexError) {
      if (indexError.code === 85) {
        console.log("Index already exists");
      } else {
        console.error("Error creating index:", indexError);
      }
    }

    // List indexes to verify
    const indexes = await collection.indexes();
    console.log("Current indexes on medicalrecords collection:");
    indexes.forEach((index) => {
      console.log(`- ${JSON.stringify(index.key)}: ${JSON.stringify(index)}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the migration
addUniqueIndexToMedicalRecords();
