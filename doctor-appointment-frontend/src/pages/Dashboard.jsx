import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // ✅ If no token or role, redirect to login
    if (!token || !role) {
      localStorage.clear(); // Just in case
      navigate('/');
      return;
    }

    // ✅ Redirect based on role
    if (role === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/patient');
    }
  }, [navigate]);

  return <p>Redirecting...</p>;
};

export default Dashboard;
