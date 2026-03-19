require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");

const main = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment");
  }

  const adminName = process.env.ADMIN_NAME || "System Admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@eventledger.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  await mongoose.connect(mongoUri);

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "admin"
  });

  console.log(`Admin created: ${adminEmail}`);
};

main()
  .catch((error) => {
    console.error("Seed admin failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
