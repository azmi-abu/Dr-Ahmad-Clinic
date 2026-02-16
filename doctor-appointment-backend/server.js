const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const notificationsRoutes = require("./routes/notifications");

dotenv.config();

console.log("BREVO_API_KEY loaded?", !!process.env.BREVO_API_KEY);
console.log("MAIL_FROM:", process.env.MAIL_FROM);

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const prescriptionsRoutes = require("./routes/prescriptions");

const app = express();

// ✅ CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// ✅ IMPORTANT: increase JSON payload for base64 uploads (forms/images)
app.use(express.json({ limit: '25mb' }));

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/notifications", notificationsRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5050, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5050}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
