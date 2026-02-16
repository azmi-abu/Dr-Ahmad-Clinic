const axios = require("axios");

async function sendOtpWithBrevo({ toEmail, otp }) {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: process.env.MAIL_FROM, name: "Clinic System" },
      to: [{ email: toEmail }],
      subject: "OTP Code",
      htmlContent: `
        <div style="font-family:Arial">
          <h3>קוד אימות להתחברות</h3>
          <div style="font-size:28px;font-weight:800;letter-spacing:6px">${otp}</div>
          <p>הקוד תקף ל-5 דקות.</p>
        </div>
      `,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
    }
  );
}

module.exports = { sendOtpWithBrevo };
