// === backend/routes/patients.js ===
const router = require('express').Router();
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');

// Get all patients (for the dropdown in doctor dashboard)
router.get('/patients', auth, async (req, res) => {
    try {
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      const patients = await User.find({ role: 'patient' }).select('name phone');
      res.json(patients);
    } catch (err) {
      console.error('Error fetching patients:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Add a new patient manually
router.post('/patients', auth, async (req, res) => {
  const { phone, name } = req.body;

  if (!phone || !name) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  const exists = await User.findOne({ phone });
  if (exists) {
    return res.status(400).json({ message: 'Patient already exists' });
  }

  try {
    const newPatient = await User.create({ phone, name, role: 'patient' });
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

