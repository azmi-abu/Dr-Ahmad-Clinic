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

// =====================
// Config
// =====================
const PORT = process.env.PORT || 5000;

// Normalize origin helper (removes trailing slash)
const normalizeOrigin = (url) => (url || "").trim().replace(/\/$/, "");

// Allow multiple origins via comma-separated list in CLIENT_ORIGIN
// Example:
// CLIENT_ORIGIN=http://localhost:3000,https://dr-ahmad-clinic.vercel.app
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => normalizeOrigin(s))
  .filter(Boolean);

// =====================
// Middleware
// =====================

// Body parser (base64 forms/images)
app.use(express.json({ limit: "25mb" }));

// CORS (bulletproof for Vercel + Render)
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server / curl / postman (no Origin header)
      if (!origin) return cb(null, true);

      const normalized = normalizeOrigin(origin);

      // Allow if origin is in allowed list
      if (allowedOrigins.includes(normalized)) return cb(null, true);

      // Block otherwise
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ IMPORTANT: handle preflight requests
app.options("*", cors());

// =====================
// Health check
// =====================
app.get("/api/health", (req, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

// =====================
// Routes
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/notifications", notificationsRoutes);

// =====================
// Start server (always)
// =====================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🌐 Allowed Origins:", allowedOrigins);
  console.log("BREVO_API_KEY loaded?", !!process.env.BREVO_API_KEY);
  console.log("MAIL_FROM:", process.env.MAIL_FROM ? "[set]" : "[missing]");
  console.log("MONGO_URI:", process.env.MONGO_URI ? "[set]" : "[missing]");
});

// =====================
// Mongo connection (after server starts)
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
