const twilio = require("twilio");
const User = require("../models/User");
const Appointment = require("../models/Appointment"); // must exist and allow .populate("patient")

function toE164Israel(phone) {
  const p = String(phone || "").trim().replace(/[-\s]/g, "");

  if (/^\+9725\d{8}$/.test(p)) return p;      // +9725xxxxxxxx
  if (/^05\d{8}$/.test(p)) return `+972${p.substring(1)}`; // 05xxxxxxxx -> +9725xxxxxxxx
  if (/^9725\d{8}$/.test(p)) return `+${p}`;  // 9725xxxxxxxx -> +9725xxxxxxxx

  return null;
}

function formatTemplateVars(dateValue) {
  const d = new Date(dateValue);

  // Keep variables simple for templates (avoid locale dots)
  const date = d.toLocaleDateString("en-GB"); // 15/02/2026
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); // 18:00
  return { date, time };
}

function getTwilioClient() {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Missing TWILIO_SID or TWILIO_AUTH_TOKEN in .env");
  return twilio(sid, token);
}

function normalizeWhatsAppTo(value) {
  const v = String(value || "").trim().split(" ")[0]; // strips inline comments
  if (!v) return null;
  if (v.startsWith("whatsapp:")) return v;
  if (v.startsWith("+")) return `whatsapp:${v}`;
  return null;
}

exports.sendAppointmentWhatsappReminder = async (req, res) => {
  try {
    // Doctor only
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({ message: "יש להתחבר עם מספר טלפון של הרופא" });
    }

    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ message: "מזהה תור נדרש " });
    }

    const doctor = await User.findById(req.user.id);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ message: "יש להתחבר עם מספר טלפון של הרופא" });
    }

    const appt = await Appointment.findById(appointmentId).populate("patient");
    if (!appt) return res.status(404).json({ message: "תור לא נמצא" });
    if (!appt.date) return res.status(400).json({ message: "תאריך התור חסר" });

    const patient = appt.patient;
    if (!patient || !patient.phone) {
      return res.status(400).json({ message: "מספר טלפון של מטופל חסר" });
    }

    const patientE164 = toE164Israel(patient.phone);
    if (!patientE164) {
      return res.status(400).json({ message: "פורמט מספר טלפון של מטופל לא חוקי" });
    }

    const mode = String(process.env.WHATSAPP_MODE || "sandbox").trim().toLowerCase();
    const from = String(process.env.TWILIO_WHATSAPP_FROM || "").trim();

    if (!from) return res.status(500).json({ message: "Missing TWILIO_WHATSAPP_FROM in .env" });

    // choose who receives in sandbox vs prod
    let to;
    let sentTo;

    if (mode === "sandbox") {
      // sandbox: always send to a joined number (doctor)
      const sandboxTo = normalizeWhatsAppTo(process.env.SANDBOX_TEST_TO);
      if (!sandboxTo) {
        return res.status(500).json({
          message: "Missing/invalid SANDBOX_TEST_TO. Use +9725xxxxxxx (no 0 after +972).",
        });
      }
      to = sandboxTo;
      sentTo = sandboxTo.replace("whatsapp:", "");
    } else {
      // production: send to patient
      to = `whatsapp:${patientE164}`;
      sentTo = patientE164;
    }

    const client = getTwilioClient();

    // ✅ SANDBOX: send FREE-FORM body (most reliable in sandbox)
    if (mode === "sandbox") {
      const whenHe = new Date(appt.date).toLocaleString("he-IL", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const body = `✅ תזכורת לתור (בדיקה - Sandbox)
מטופל: ${patient?.name || "ללא שם"}
מועד: ${whenHe}`;

      console.log("TWILIO SEND (SANDBOX BODY):", { from, to, body });

      const msg = await client.messages.create({ from, to, body });

      return res.json({ ok: true, sid: msg.sid, mode, sentTo });
    }

    // ✅ PROD: send TEMPLATE using Content API
    const contentSid = String(process.env.TWILIO_TEMPLATE_SID || "").trim();
    if (!contentSid) return res.status(500).json({ message: "Missing TWILIO_TEMPLATE_SID in .env" });

    const { date, time } = formatTemplateVars(appt.date);
    const vars = { "1": String(date), "2": String(time) };

    console.log("TWILIO SEND (PROD TEMPLATE):", {
      from,
      to,
      contentSid,
      contentVariables: JSON.stringify(vars),
    });

    const msg = await client.messages.create({
      from,
      to,
      contentSid,
      contentVariables: JSON.stringify(vars),
    });

    return res.json({ ok: true, sid: msg.sid, mode, sentTo });
  } catch (err) {
    console.error("WhatsApp reminder error:", err);
    return res.status(500).json({
      message: err?.message || "Failed to send WhatsApp reminder",
      code: err?.code,
      status: err?.status,
      moreInfo: err?.moreInfo,
      details: err?.details,
    });
  }
};
