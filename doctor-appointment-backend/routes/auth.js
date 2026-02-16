const router = require('express').Router();
const { requestOTP, verifyOTP,   requestOTPEmailByPhone, verifyOTPEmailByPhone } = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Auth endpoints
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post("/request-otp-email-by-phone", requestOTPEmailByPhone);
router.post("/verify-otp-email-by-phone", verifyOTPEmailByPhone);
// Get all doctors
router.get('/doctors', auth, async (req, res) => {
  const doctors = await User.find({ role: 'doctor' });
  console.log('Doctors from DB:', doctors);
  res.json(doctors);
});

// ✅ Get a specific doctor by ID
router.get('/doctors/:id', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user-exists/:phone', async (req, res) => {
  const { phone } = req.params;
  const user = await User.findOne({ phone });
  res.json({ exists: !!user });
});

module.exports = router;
