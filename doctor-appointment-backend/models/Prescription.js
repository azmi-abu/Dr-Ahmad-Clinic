const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "מרשם" },
    notes: { type: String, required: true }, // how to use / instructions
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
