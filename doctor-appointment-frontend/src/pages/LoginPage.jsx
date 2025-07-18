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

  // Allow only digits
  if (!/^\d*$/.test(val)) return;

  // Max 10 digits
  if (val.length > 10) return;

  setPhone(val);
};

const requestOtp = async () => {
  const phoneRegex = /^05\d{8}$/;

  if (!phoneRegex.test(phone)) {
    setMessage('❌ Phone number must start with 05 and be 10 digits');
    setShake(true);
    setTimeout(() => {
      setMessage('');
      setShake(false);
    }, 3000);
    return;
  }

  try {
    // Check if user already exists
    const res = await api.get(`/auth/user-exists/${phone}`);
    const exists = res.data.exists;
    setIsExistingUser(exists);
    await api.post('/auth/request-otp', exists ? { phone } : { phone, name });
    setStep(2);
    setMessage('✅ OTP sent to your phone');
    setTimeout(() => setMessage(''), 3000);
  } catch {
    setMessage('❌ Failed to send OTP');
    setShake(true);
    setTimeout(() => {
      setMessage('');
      setShake(false);
    }, 3000);
  }
};

  

  const verifyOtp = async () => {
    if (!isExistingUser && !name.trim()) {
      setMessage('❌ Name is required');
      setShake(true);
      setTimeout(() => {
        setMessage('');
        setShake(false);
      }, 3000);
      return;
    }
    try {
      const res = await api.post('/auth/verify-otp', isExistingUser ? { phone, otp } : { phone, otp, name });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      setMessage('✅ Login successful!');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch {
      setMessage('❌ Invalid OTP');
      setShake(true);
      setTimeout(() => {
        setMessage('');
        setShake(false);
      }, 3000);
    }
    
  };

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
  <div className="w-full max-w-5xl bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
    
    {/* Left Panel */}
    <div className="md:w-1/2 bg-white relative">
      <img
        src="/images/doctor.jpg"
        alt="Doctor"
        className="w-full h-64 md:h-full object-cover"
      />
      <div className="absolute bottom-0 w-full bg-blue-700 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome to <span className="text-white">Dr. Ahmed's Clinic!</span></h2>
        <p className="text-sm">
          Cloud Based Streamline Esthitic Clinic System with centralized user friendly platform
        </p>
      </div>
    </div>

    {/* Right Panel - Login */}
    <div className="md:w-1/2 p-10 flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-blue-800 mb-2">Login</h2>
      <p className="text-sm text-gray-600 mb-6">
        {step === 1 ? 'Enter your phone number to log in': 'Enter the OTP you received'}</p>
      {step === 1 && (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      requestOtp();
    }}
  >
    <label className="block mb-2 text-sm font-medium text-gray-700">Phone Number</label>
    <input
      type="text"
      value={phone}
      onChange={handlePhoneChange}
      className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      placeholder="e.g. 0501234567"
    />
    <button
      type="submit"
      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition mb-2"
    >
      Send OTP
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
        <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g. John Doe"
        />
      </>
    )}

    <label className="block mb-2 text-sm font-medium text-gray-700">Enter OTP</label>
    <input
      type="text"
      value={otp}
      onChange={(e) => {
        const val = e.target.value;
        if (/^\d{0,6}$/.test(val)) setOtp(val); // only up to 6 digits
      }}
      className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      placeholder="e.g. 123456"
    />


    <button
      type="submit"
      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
    >
      Verify OTP
    </button>
  </form>
)}


      {message && (
        <div className={`mt-4 text-center text-sm text-gray-700 ${shake ? 'animate-shake' : ''}`}>
        {message}
      </div>
      
      )}
    </div>
  </div>
</div>

  );
};

export default LoginPage;
