const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const authRoutes = require("./routes/auth");
const appointmentRoutes = require("./routes/appointments");
const patientRoutes = require("./routes/patients");
const prescriptionsRoutes = require("./routes/prescriptions");
const notificationsRoutes = require("./routes/notifications");

const app = express();

// ✅ Config
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

// ✅ Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ IMPORTANT: increase JSON payload for base64 uploads (forms/images)
app.use(express.json({ limit: "25mb" }));

// ✅ Health check (for debugging + Render)
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
  });
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/notifications", notificationsRoutes);

// ✅ Start server FIRST (so you never get connection refused)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Allowed Origin: ${CLIENT_ORIGIN}`);
  console.log("BREVO_API_KEY loaded?", !!process.env.BREVO_API_KEY);
  console.log("MAIL_FROM:", process.env.MAIL_FROM ? "[set]" : "[missing]");
  console.log("MONGO_URI:", process.env.MONGO_URI ? "[set]" : "[missing]");
});

// ✅ Connect to Mongo SECOND (so you can still hit the API even if Mongo fails)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
