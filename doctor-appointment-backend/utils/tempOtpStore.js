// const otpMap = new Map();

// module.exports = {
//   setOTP: (phone, otp, expiresAt) => otpMap.set(phone, { otp, expiresAt }),
//   getOTP: (phone) => otpMap.get(phone),
//   clearOTP: (phone) => otpMap.delete(phone),
// };
// // not used currently since we store OTP in the User model, but can be used for a more scalable solution in the future (e.g. if we want to support multiple OTPs per user or store additional metadata)