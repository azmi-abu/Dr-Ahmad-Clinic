const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['מילוי שפתיים', 'פיסול פנים', 'בוטוקס', 'סקולפטרא', 'מורפיוס 8'] },
  date: Date,
  status: { type: String, enum: ['scheduled', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
