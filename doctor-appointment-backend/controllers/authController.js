// controllers/authController.js

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { setOTP, getOTP, clearOTP } = require("../utils/tempOtpStore");
const { sendOtpWithBrevo } = require("../utils/brevoMailer");

// OTP settings
const OTP_MINUTES = Number(process.env.OTP_TTL_MINUTES || 5);

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const getExpiryDate = () => new Date(Date.now() + OTP_MINUTES * 60 * 1000);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// =========================
// PHONE OTP (existing flow) - upgraded to store hashed OTP
// =========================

exports.requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^05\d{8}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "מספר טלפון חייב להתחיל ב-05 ולכלול 10 ספרות" });
    }

    const otp = generateOtp();
    const expiresAt = getExpiryDate();
    const otpHash = await bcrypt.hash(otp, 10);

    const user = await User.findOne({ phone });

    if (user) {
      // Save OTP hash to DB for existing users
      user.otp = otpHash;
      user.otpExpires = expiresAt;
      await user.save();
    } else {
      // Save OTP hash in temp store for new users
      setOTP(phone, otpHash, expiresAt);
    }

    // In your phone-based flow you likely send SMS here.
    // For now, keep console log:
    console.log(`[OTP:PHONE] ${otp} sent to ${phone}`);

    return res.json({ message: "OTP נשלח", alreadyRegistered: !!user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "שליחת OTP נכשלה" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !/^05\d{8}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "מספר טלפון חייב להתחיל ב-05 ולכלול 10 ספרות" });
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: "קוד אימות בן 6 ספרות" });
    }

    let user = await User.findOne({ phone });

    if (user) {
      if (!user.otp || !user.otpExpires) {
        return res.status(401).json({ message: "קוד אימות שגוי" });
      }

      const expired = user.otpExpires < new Date();
      const ok = await bcrypt.compare(String(otp), user.otp);

      if (!ok || expired) {
        return res.status(401).json({ message: "קוד אימות שגוי" });
      }

      // clear OTP after success
      user.otp = null;
      user.otpExpires = null;
      await user.save();
    } else {
      const temp = getOTP(phone);

      if (!temp) {
        return res.status(401).json({ message: "קוד אימות שגוי" });
      }

      const expired = temp.expiresAt < new Date();
      const ok = await bcrypt.compare(String(otp), temp.otp);

      if (!ok || expired) {
        return res.status(401).json({ message: "קוד אימות שגוי" });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "שם נדרש" });
      }

      user = await User.create({ phone, name: name.trim() });
      clearOTP(phone); // ✅ Clean up after use
    }

    const token = signToken(user);
    return res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// =========================
// EMAIL OTP (NEW) - uses Brevo
// Endpoints:
// POST /auth/request-otp-email
// POST /auth/verify-otp-email
// =========================

exports.requestOTPEmailByPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^05\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must start with 05 and contain 10 digits" });
    }

    // ✅ Hard restriction: only the doctor phone is allowed
    if (process.env.DOCTOR_PHONE && phone !== process.env.DOCTOR_PHONE) {
      return res.status(403).json({ message: "רופא בלבד" });
    }

    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ message: "משתמש לא נמצא" });
    if (user.role !== "doctor") return res.status(403).json({ message: "רופא בלבד" });

    if (!user.email) {
      return res.status(400).json({ message: "כתובת אימייל של רופא לא הוגדרה במסד הנתונים" });
    }

    const otp = generateOtp();
    const expiresAt = getExpiryDate();
    const otpHash = await bcrypt.hash(otp, 10);

    user.otp = otpHash;
    user.otpExpires = expiresAt;
    await user.save();

    // for testing you can force all to LEADS_TO_EMAIL
    const toEmail = process.env.LEADS_TO_EMAIL?.trim() || user.email;

    await sendOtpWithBrevo({ toEmail, otp });

    console.log(`[OTP:EMAIL-BY-PHONE] sent to ${toEmail} (doctor phone: ${phone})`);

    return res.json({ message: "OTP sent to doctor email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send OTP email" });
  }
};

exports.verifyOTPEmailByPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !/^05\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must start with 05 and contain 10 digits" });
    }

    if (!otp || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    // ✅ Hard restriction: only the doctor phone is allowed
    if (process.env.DOCTOR_PHONE && phone !== process.env.DOCTOR_PHONE) {
      return res.status(403).json({ message: "Doctor only" });
    }

    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "doctor") return res.status(403).json({ message: "Doctor only" });

    if (!user.otp || !user.otpExpires) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const expired = user.otpExpires < new Date();
    const ok = await bcrypt.compare(String(otp), user.otp);

    if (!ok || expired) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = signToken(user);
    return res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};