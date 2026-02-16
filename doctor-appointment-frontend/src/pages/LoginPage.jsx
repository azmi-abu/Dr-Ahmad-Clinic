import React, { useState } from "react";
import api from "../services/api";

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(""); // ✅ phone input (doctor only)
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const flash = (text, isError = false) => {
    setMessage(text);
    setShake(isError);
    setTimeout(() => {
      setMessage("");
      setShake(false);
    }, 3000);
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    if (val.length > 10) return;
    setPhone(val);
  };

  const requestOtp = async () => {
    const phoneRegex = /^05\d{8}$/;

    if (!phoneRegex.test(phone)) {
      flash("❌ מספר הטלפון חייב להתחיל ב־05 ולהכיל 10 ספרות", true);
      return;
    }

    try {
      setLoading(true);

      // ✅ Sends OTP to the doctor's EMAIL using PHONE (backend resolves email by phone)
      await api.post("/auth/request-otp-email-by-phone", { phone });

      flash("✅ קוד אימות נשלח למייל של הרופא");
      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message;
      flash(msg ? `❌ ${msg}` : "❌ שליחת הקוד נכשלה", true);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      flash("❌ קוד אימות חייב להכיל 6 ספרות", true);
      return;
    }

    try {
      setLoading(true);

      // ✅ Verifies OTP using PHONE + OTP (doctor only)
      const res = await api.post("/auth/verify-otp-email-by-phone", {
        phone,
        otp,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      flash("✅ התחברת בהצלחה");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      const msg = err?.response?.data?.message;
      flash(msg ? `❌ ${msg}` : "❌ קוד אימות שגוי", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-gray-100 px-4"
    >
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* צד שמאל – תמונה */}
        <div className="md:w-1/2 bg-white relative">
          <img
            src="/images/doctor.jpg"
            alt="רופא"
            className="w-full h-64 md:h-full object-cover"
          />
          <div className="absolute bottom-0 w-full bg-blue-700 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">
              ברוכים הבאים ל־<span className="text-white">מרפאת ד״ר אחמד</span>
            </h2>
            <p className="text-sm">
              מערכת רפואית חכמה מבוססת ענן לניהול מרפאה בצורה נוחה ומתקדמת
            </p>
          </div>
        </div>

        {/* צד ימין – התחברות */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">
            התחברות למערכת
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            {step === 1
              ? "הזן מספר  טלפון כדי להתחבר למערכת"
              : "הזן את קוד האימות שנשלח למייל של הרופא"}
          </p>

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) requestOtp();
              }}
            >
              <label className="block mb-2 text-sm font-medium text-gray-700">
                מספר טלפון
              </label>
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="לדוגמה: 0501234567"
                inputMode="numeric"
                autoComplete="tel"
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-2 rounded-lg transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "שולח..." : "שלח קוד אימות"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) verifyOtp();
              }}
            >
              <label className="block mb-2 text-sm font-medium text-gray-700">
                קוד אימות
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,6}$/.test(val)) setOtp(val);
                }}
                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="לדוגמה: 123456"
                inputMode="numeric"
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-2 rounded-lg transition ${
                  loading
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "מאמת..." : "אימות והתחברות"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMessage("");
                }}
                className={`w-full mt-3 py-2 rounded-lg transition ${
                  loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                חזרה
              </button>

              <div className="mt-3 text-xs text-gray-500 text-center">
                נשלח למייל שמוגדר עבור מספר הטלפון הזה
              </div>
            </form>
          )}

          {message && (
            <div
              className={`mt-4 text-center text-sm text-gray-700 ${
                shake ? "animate-shake" : ""
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
