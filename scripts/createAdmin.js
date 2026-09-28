require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

// Admin credentials come from .env, never from source code.
const createAdmin = async () => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env first");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      name: "Clinic Administrator",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created:", ADMIN_EMAIL);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();