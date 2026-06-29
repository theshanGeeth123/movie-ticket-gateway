import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
      console.error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required in .env");
      process.exit(1);
    }

    const existingAdmin = await User.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      existingAdmin.name = adminName;
      existingAdmin.role = "admin";
      existingAdmin.isEmailVerified = true;
      existingAdmin.isActive = true;

      if (!existingAdmin.password) {
        existingAdmin.password = adminPassword;
      }

      if (existingAdmin.authProvider === "google") {
        existingAdmin.authProvider = "both";
      }

      await existingAdmin.save();

      console.log("Admin user already existed. Admin details updated successfully.");
      process.exit(0);
    }

    await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: "admin",
      authProvider: "local",
      isEmailVerified: true,
      isActive: true,
    });

    console.log("Admin user created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();