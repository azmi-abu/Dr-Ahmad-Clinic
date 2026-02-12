const router = require("express").Router();
const { auth } = require("../middleware/authMiddleware");
const {
  createPrescription,
  getMyPatientPrescriptions,
  deletePrescription,
  downloadPrescriptionPdf,
} = require("../controllers/prescriptionController");

// ✅ keep this order
router.get("/item/:id/pdf", auth, downloadPrescriptionPdf);
router.delete("/item/:id", auth, deletePrescription);

router.post("/", auth, createPrescription);
router.get("/:patientId", auth, getMyPatientPrescriptions);

module.exports = router;
