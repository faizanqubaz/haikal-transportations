
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Admin from "../models/Admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });


async function createAdmin() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connected");
    console.log("📦 Database:", mongoose.connection.name);

    const username = "admin@carenest.com";
    const password = "Admin123!";

    // Check whether admin already exists
    const existingAdmin = await Admin.findOne({
      username: username.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await Admin.create({
      username: username.toLowerCase(),
      passwordHash,
      role: "admin",
    });

    console.log("=================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Username:", admin.username);
    console.log("Role:", admin.role);
    console.log("=================================");

    await mongoose.disconnect();

    console.log("🔌 MongoDB disconnected");
  } catch (error) {
    console.error("❌ Failed to create admin:");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
}

createAdmin();