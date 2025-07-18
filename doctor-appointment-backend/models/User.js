const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  from: { type: String, required: true }, // e.g., "09:00"
  to: { type: String, required: true }    // e.g., "17:00"
});

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true},
  otp: String,
  otpExpires: Date,
  role: { type: String, enum: ['doctor', 'patient'], default: 'patient' },
  availability: [availabilitySchema] // Only relevant if role is doctor
});

module.exports = mongoose.model('User', userSchema);
