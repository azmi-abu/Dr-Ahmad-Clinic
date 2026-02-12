import React, { useState } from 'react';
import api from '../services/api';

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [name, setName] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    if (val.length > 10) return;
    setPhone(val);
  };

  const requestOtp = async () => {
    const phoneRegex = /^05\d{8}$/;

    if (!phoneRegex.test(phone)) {
      setMessage('❌ מספר הטלפון חייב להתחיל ב־05 ולהכיל 10 ספרות');
      setShake(true);
      setTimeout(() => {
        setMessage('');
        setShake(false);
      }, 3000);
      return;
    }

    try {
      const res = await api.get(`/auth/user-exists/${phone}`);
      const exists = res.data.exists;
      setIsExistingUser(exists);

      await api.post(
        '/auth/request-otp',
        exists ? { phone } : { phone, name }
      );

      setStep(2);
      setMessage('✅ קוד אימות נשלח לטלפון שלך');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ שליחת הקוד נכשלה');
      setShake(true);
      setTimeout(() => {
        setMessage('');
        setShake(false);
      }, 3000);
    }
  };

  const verifyOtp = async () => {
    if (!isExistingUser && !name.trim()) {
      setMessage('❌ שם מלא הוא שדה חובה');
      setShake(true);
      setTimeout(() => {
        setMessage('');
        setShake(false);
      }, 3000);
      return;
    }

    try {
      const res = await api.post(
        '/auth/verify-otp',
        isExistingUser
          ? { phone, otp }
          : { phone, otp, name }
      );

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      setMessage('✅ התחברת בהצלחה');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch {
      setMessage('❌ קוד אימות שגוי');
      setShake(true);
      setTimeout(() => {
        setMessage('');
        setShake(false);
      }, 3000);
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
              ? 'הזן מספר טלפון כדי להתחבר'
              : 'הזן את קוד האימות שנשלח אליך'}
          </p>

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestOtp();
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
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                שלח קוד אימות
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyOtp();
              }}
            >
              {!isExistingUser && (
                <>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="לדוגמה: מוחמד עלי"
                  />
                </>
              )}

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
              />

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                אימות והתחברות
              </button>
            </form>
          )}

          {message && (
            <div
              className={`mt-4 text-center text-sm text-gray-700 ${
                shake ? 'animate-shake' : ''
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
