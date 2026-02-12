const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

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

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5050, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5050}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
