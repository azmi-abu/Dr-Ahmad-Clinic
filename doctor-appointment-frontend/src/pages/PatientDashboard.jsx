import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'patient') {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointments', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAppointments(res.data);
      } catch (err) {
        alert('Failed to load appointments');
      }
    };

    fetchAppointments();
  }, []);

  const cancelAppointment = async (id) => {
    await api.delete(`/appointments/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setAppointments(prev => prev.filter(a => a._id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 relative">
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = '/';
        }}
        className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:w-1/2 hidden lg:block">
          <img
            src="/images/clinic-banner.jpg"
            alt="Clinic"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="lg:w-1/2 w-full p-10 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 mb-2">Welcome Back 👋</h1>
            <p className="text-gray-600 mb-6">Here are your upcoming appointments:</p>

            {appointments.length > 0 ? (
              <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {appointments.map((a) => (
                  <li
                    key={a._id}
                    className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-blue-700">{a.type}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(a.date).toLocaleDateString()} - {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Doctor: {a.doctor?.name || a.doctor?.phone || 'Unknown'} <br />
                      Status: {a.status}
                    </p>
                    {a.status !== 'cancelled' && (
                      <button
                        onClick={() => cancelAppointment(a._id)}
                        className="mt-2 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 mt-10">
                <img src="/images/no-appointments.png" alt="No appointments" className="mx-auto w-32 mb-4" />
                <p>No appointments scheduled yet.</p>
              </div>
            )}
          </div>

          <div className="mt-10">
            <button
              onClick={() => navigate('/book')}
              className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 shadow-md transition"
            >
              📅 Book a New Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
