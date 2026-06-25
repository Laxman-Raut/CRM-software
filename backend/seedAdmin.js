import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const MONGO_URI = process.env.MONGO_URI;

console.log("MONGO_URI =", MONGO_URI); // Debug

try {
  await mongoose.connect(MONGO_URI);

  // Clear existing admin user if any, or check if it exists
  const existingAdmin = await User.findOne({ email: "adminlaxman@gmail.com" });
  if (existingAdmin) {
    console.log("Admin already exists. Deleting it to re-seed...");
    await User.deleteOne({ email: "adminlaxman@gmail.com" });
  }

  const hashedPassword = await bcrypt.hash("laxman", 10);

  await User.create({
    name: "System Admin",
    email: "adminlaxman@gmail.com",
    password: hashedPassword,
    role: "admin",
    permissions: {
      canViewLeads: true,
      canUpdateLeads: true,
      canDeleteLeads: true,
    },
  });

  console.log("Admin Created/Seeded Successfully");
} catch (error) {
  console.error("Error creating admin:", error);
} finally {
  await mongoose.connection.close();
}