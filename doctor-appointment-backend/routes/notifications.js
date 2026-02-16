const router = require("express").Router();
const { auth } = require("../middleware/authMiddleware");
const { sendAppointmentWhatsappReminder } = require("../controllers/notificationsController");

router.post("/whatsapp/appointment-reminder", auth, sendAppointmentWhatsappReminder);

module.exports = router;
