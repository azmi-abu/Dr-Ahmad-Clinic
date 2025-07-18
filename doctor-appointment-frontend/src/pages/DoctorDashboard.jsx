// DoctorDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointments/doctor', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAppointments(res.data);
      } catch (err) {
        console.error('Failed to fetch doctor appointments:', err);
      }
    };
    fetchAppointments();
  }, []);

  const cancelAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAppointments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('Failed to cancel appointment');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 px-6 py-10">
      {/* Logout */}
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = '/';
        }}
        className="absolute top-6 right-6 px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
      >
        Logout
      </button>

      <div className="max-w-5xl mx-auto mt-20">
        <h2 className="text-3xl font-bold text-blue-800 mb-6">Doctor Dashboard</h2>

        <h3 className="text-xl font-semibold mb-4">Upcoming Appointments</h3>
        {appointments.length === 0 ? (
          <p className="text-gray-600">No scheduled appointments.</p>
        ) : (
          <ul className="space-y-4">
            {appointments.map(a => (
              <li key={a._id} className="bg-white p-4 border rounded-xl shadow">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{a.patient?.name || 'Unknown Patient'}</span>
                  <span className="text-sm text-gray-600">
                    {new Date(a.date).toLocaleDateString()} - {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">Treatment: {a.type}</p>
                <p className="text-gray-600 text-xs mb-2">Status: {a.status}</p>
                <button
                  onClick={() => cancelAppointment(a._id)}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded"
                >
                  Cancel Appointment
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
