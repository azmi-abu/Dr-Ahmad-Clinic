const otpMap = new Map();

module.exports = {
  setOTP: (phone, otp, expiresAt) => otpMap.set(phone, { otp, expiresAt }),
  getOTP: (phone) => otpMap.get(phone),
  clearOTP: (phone) => otpMap.delete(phone),
};
