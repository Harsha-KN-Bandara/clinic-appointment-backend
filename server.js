require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploaded doctor images publicly accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Clinic Appointment API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

// 404 handler for any route that doesn't match above
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler — must be last, and must take 4 args for
// Express to recognise it as an error handler.
app.use((err, req, res, next) => {
  console.error(err);

  // Multer errors (file too large, wrong type) have a distinct shape
  // and would otherwise bypass this and hit Express's default HTML
  // error page instead of returning clean JSON.
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image must be 5MB or smaller" });
    }
    return res.status(400).json({ message: err.message });
  }

  // fileFilter in uploadMiddleware.js rejects bad file types by
  // calling cb(new Error(...)), which also lands here.
  if (err.message && err.message.includes("images are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

// '0.0.0.0' binds to all network interfaces so devices on the same
// network (or a hosting platform's proxy) can reach the server.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running globally on port ${PORT}`);
});