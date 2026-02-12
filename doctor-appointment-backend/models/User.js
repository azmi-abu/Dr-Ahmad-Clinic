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

const consentFormSchema = new mongoose.Schema(
  {
    data: String,       // data:<mime>;base64,xxxx
    filename: String,
    mimeType: String,
    uploadedAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  role: { type: String, enum: ['doctor', 'patient'], default: 'patient' },

  // ✅ Profile picture
  profileImage: {
    data: String,       // data:image/...;base64,...
    uploadedAt: Date,
  },

  // ✅ Consent forms stored on the patient
  consentForms: {
    botox: consentFormSchema,
    hyaluronic: consentFormSchema,
    sculptra: consentFormSchema,
    salmon: consentFormSchema,
  },

  availability: [availabilitySchema] // Only relevant if role is doctor
});

module.exports = mongoose.model('User', userSchema);
