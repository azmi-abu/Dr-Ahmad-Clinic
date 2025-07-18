const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Create a new appointment
exports.createAppointment = async (req, res) => {
  const { doctorId, type, date } = req.body;
  try {
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      type,
      date
    });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get appointments for the logged-in user
exports.getMyAppointments = async (req, res) => {
  const roleField = req.user.role === 'doctor' ? 'doctor' : 'patient';
  const appointments = await Appointment.find({ [roleField]: req.user.id }).populate('patient doctor');
  res.json(appointments);
};

// Cancel an appointment (by patient or doctor)
exports.cancelAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.sendStatus(404);

  if (
    appointment.patient.toString() !== req.user.id &&
    appointment.doctor.toString() !== req.user.id
  ) {
    return res.sendStatus(403);
  }

  appointment.status = 'cancelled';
  await appointment.save();
  res.json({ message: 'Appointment cancelled' });
};

// Get available slots for a doctor on a given date
exports.getAvailableSlots = async (req, res) => {
  const { doctorId, day } = req.query;

  if (!doctorId || !day) {
    return res.status(400).json({ message: 'doctorId and day are required' });
  }

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  const availability = doctor.availability.find((slot) => slot.day === day);
  if (!availability) return res.json([]);

  const { from, to } = availability;
  const [fromHour, fromMin] = from.split(':').map(Number);
  const [toHour, toMin] = to.split(':').map(Number);

  // Find next occurrence of the selected day (e.g., next Tuesday)
  const targetDate = new Date();
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const currentDayIndex = targetDate.getDay();
  const targetDayIndex = weekdays.indexOf(day);
  const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  targetDate.setHours(0, 0, 0, 0); // reset time

  const slots = [];
  const slotTime = new Date(targetDate);
  slotTime.setHours(fromHour, fromMin, 0, 0);
  const endTime = new Date(targetDate);
  endTime.setHours(toHour, toMin, 0, 0);

  // Fetch booked appointments
  const existingAppointments = await Appointment.find({
    doctor: doctorId,
    date: {
      $gte: slotTime,
      $lte: endTime
    },
    status: 'scheduled'
  });

  const bookedTimes = existingAppointments.map((appt) =>
    new Date(appt.date).toISOString()
  );

  while (slotTime <= endTime) {
    const iso = new Date(slotTime).toISOString();
    if (!bookedTimes.includes(iso)) {
      slots.push(iso);
    }
    slotTime.setMinutes(slotTime.getMinutes() + 30);
  }

  res.json(slots);
};

exports.getDoctorAppointments = async(req,res) => {
  const doctorId = req.user.id;

  const appointments = await Appointment.find({
    doctor: doctorId,
    status: 'scheduled'
  }).populate('patient','name phone');

  res.json(appointments);
};