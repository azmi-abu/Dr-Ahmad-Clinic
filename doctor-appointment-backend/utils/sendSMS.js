const axios = require('axios');
require('dotenv').config();

/**
 * Send OTP using Cellact API
 * @param {string} phone - Israeli phone number, e.g., '0501234567' or '+972501234567'
 * @param {string} otp - The OTP to send
 */
const sendOTPViaSMS = async (phone, otp) => {
  const username = process.env.CELLACT_USER;
  const password = process.env.CELLACT_PASS;
  const sender = process.env.CELLACT_SENDER || 'קלינקת דוקטור אחמד';

  // Normalize phone number to international format (assumes Israeli number)
  const formattedPhone = phone.startsWith('+972')
    ? phone
    : '+972' + phone.replace(/^0/, '');

  const message = `קוד האימות שלך לקלינקת דוקטור אחמד הוא: ${otp}`;

  const url = 'https://login.cellact.co.il/SendMessage.aspx';

  try {
    const res = await axios.get(url, {
      params: {
        UserName: username,
        PassWord: password,
        Destination: formattedPhone,
        Originator: sender,
        Message: message,
        Encoding: 'utf-8'
      }
    });

    if (!res.data.includes('OK')) {
      console.error('Cellact error:', res.data);
      throw new Error('Failed to send SMS');
    }

    console.log(`[SMS] OTP sent to ${formattedPhone}`);
  } catch (err) {
    console.error('Error sending SMS:', err.message);
  }
};

module.exports = { sendOTPViaSMS };
