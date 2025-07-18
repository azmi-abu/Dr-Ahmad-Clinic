const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { setOTP, getOTP, clearOTP } = require('../utils/tempOtpStore');

// requestOTP
exports.requestOTP = async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  const user = await User.findOne({ phone });

  if (user) {
    // Save OTP to DB for existing users
    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();
  } else {
    // Save OTP in temp store for new users
    setOTP(phone, otp, expiry);
  }

  console.log(`[OTP] ${otp} sent to ${phone}`);
  res.json({ message: 'OTP sent', alreadyRegistered: !!user });
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp, name } = req.body;
  let user = await User.findOne({ phone });

  if (user) {
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();
  } else {
    const temp = getOTP(phone);
    if (!temp || temp.otp !== otp || temp.expiresAt < Date.now()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    user = await User.create({ phone, name: name.trim() });
    clearOTP(phone); // ✅ Clean up after use
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, role: user.role });
};







