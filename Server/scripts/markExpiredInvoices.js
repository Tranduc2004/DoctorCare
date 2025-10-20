#!/usr/bin/env node
/**
 * One-off script to mark appointments whose consultation invoice is expired.
 * Usage:
 *   node scripts/markExpiredInvoices.js --mongo mongodb://... --dry
 * Flags:
 *   --mongo <uri>   MongoDB connection URI (falls back to process.env.MONGO_URI)
 *   --dry           Run in dry-run mode (log only, no writes)
 */

const mongoose = require("mongoose");
const { URL } = require("url");

const argv = process.argv.slice(2);
let mongoUri = process.env.MONGODB_URI || null;
let dry = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--mongo" && argv[i + 1]) {
    mongoUri = argv[i + 1];
    i++;
  }
  if (argv[i] === "--dry") dry = true;
}
if (!mongoUri) {
  console.error(
    "Mongo URI not provided. Use --mongo or set MONGODB_URI env var."
  );
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to", mongoUri.replace(/:\/\/.+@/, "://***@"));

  const db = mongoose.connection.db;
  const now = new Date();

  // Find pending consultation invoices that are past due
  const invoices = await db
    .collection("invoices")
    .find({ type: "consultation", status: "pending", dueDate: { $lte: now } })
    .toArray();
  console.log("Found", invoices.length, "expired pending invoices");

  let updated = 0;
  for (const inv of invoices) {
    try {
      const appointmentId = inv.appointmentId;
      const set = {
        status: "payment_overdue",
        holdExpiresAt: inv.dueDate,
      };
      console.log(
        `Invoice ${inv._id} -> appointment ${appointmentId} -> set`,
        set
      );
      if (!dry) {
        const res = await db
          .collection("appointments")
          .updateOne({ _id: appointmentId }, { $set: set });
        if (res.modifiedCount) updated++;
        try {
          // also release the related schedule slot if present
          const appt = await db
            .collection("appointments")
            .findOne({ _id: appointmentId }, { projection: { scheduleId: 1 } });
          if (appt && appt.scheduleId) {
            await db
              .collection("doctorschedules")
              .updateOne(
                { _id: appt.scheduleId },
                { $set: { isBooked: false } }
              );
          }
        } catch (e) {
          console.error(
            "Failed to release schedule for appointment",
            appointmentId,
            e
          );
        }
      }
    } catch (err) {
      console.error("Error handling invoice", inv._id, err);
    }
  }

  console.log("Done. Updated appointments:", updated);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
