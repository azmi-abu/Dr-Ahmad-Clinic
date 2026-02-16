const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  from: { type: String, required: true },
  to: { type: String, required: true }
});

const consentFormSchema = new mongoose.Schema(
  {
    data: String,
    filename: String,
    mimeType: String,
    uploadedAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },

  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    // optional basic validation (won't block empty because sparse)
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
  },

  name: { type: String, required: true },

  otp: String,       // store bcrypt hash here (we’ll do in controller)
  otpExpires: Date,

  role: { type: String, enum: ['doctor', 'patient'], default: 'patient' },

  profileImage: {
    data: String,
    uploadedAt: Date,
  },

  consentForms: {
    botox: consentFormSchema,
    hyaluronic: consentFormSchema,
    sculptra: consentFormSchema,
    salmon: consentFormSchema,
  },

  availability: [availabilitySchema]
});

module.exports = mongoose.model('User', userSchema);
