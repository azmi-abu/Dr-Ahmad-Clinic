const router = require('express').Router();
const { createAppointment, getMyAppointments, cancelAppointment, getAvailableSlots } = require('../controllers/appointmentController');
const { auth } = require('../middleware/authMiddleware');
const { getDoctorAppointments } = require ('../controllers/appointmentController');

router.post('/', auth, createAppointment);
router.get('/', auth, getMyAppointments);
router.delete('/:id', auth, cancelAppointment);
router.get('/available', auth, getAvailableSlots);
router.get('/doctor', auth, getDoctorAppointments);

module.exports = router;
