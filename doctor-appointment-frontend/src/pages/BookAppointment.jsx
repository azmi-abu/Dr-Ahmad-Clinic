import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [type, setType] = useState('Lip Filler');
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/auth/doctors', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Fetched doctors:', res.data); 
        setDoctors(res.data);
      } catch {
        alert('❌ Failed to load doctors');
      }
    };
    fetchDoctors();
  }, []);
  

  const fetchAvailableDays = async (id) => {
    try {
      const res = await api.get(`/auth/doctors/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Doctor availability:', res.data.availability); // ✅ Log here
      setAvailableDays(res.data.availability || []);
    } catch (err) {
      console.error('Error fetching availability:', err); // ✅ Log error
      setAvailableDays([]);
      alert('❌ Failed to load availability');
    }
  };
  

  const fetchSlots = async (day) => {
    if (!doctorId || !day) return;
    try {
      const res = await api.get(`/appointments/available?doctorId=${doctorId}&day=${day}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAvailableSlots(res.data); // expected: array of ISO date strings
    } catch {
      setAvailableSlots([]);
      alert('❌ Failed to fetch time slots');
    }
  };

  const book = async () => {
    if (!doctorId || !type || !selectedSlot) {
      alert('❗ Please fill in all fields');
      return;
    }

    try {
      await api.post(
        '/appointments',
        { doctorId, type, date: selectedSlot },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('✅ Appointment booked!');
      navigate('/patient');
    } catch (err) {
      console.error(err);
      alert('❌ Booking failed!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">📅 Book Appointment</h2>

        {/* Doctor */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Doctor:</label>
          <select
            value={doctorId}
            onChange={(e) => {
              const id = e.target.value;
              setDoctorId(id);
              setAvailableDays([]);
              setAvailableSlots([]);
              setSelectedDay('');
              setSelectedSlot('');
              if (id) fetchAvailableDays(id);
            }}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">Select a doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name || doc.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment Type */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Appointment Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="Lip Filler">Lip Filler</option>
            <option value="Cheek Filler">Cheek Filler</option>
            <option value="Forehead Filler">Forehead Filler</option>
            <option value="Hair Laser">Hair Laser</option>
          </select>
        </div>
        {/* Day of Week - Buttons */}
        {availableDays.length > 0 && (
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Choose Day:</label>
            <div className="flex flex-wrap gap-2">
              {availableDays.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDay(item.day);
                    setSelectedSlot('');
                    fetchSlots(item.day);
                  }}
                  className={`px-4 py-2 rounded border font-semibold ${
                    selectedDay === item.day ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {item.day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Slots */}
        {availableSlots.length > 0 && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Available Time:</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full border px-4 py-2 rounded"
            >
              <option value="">Select a time</option>
              {availableSlots.map((slot, idx) => (
                <option key={idx} value={slot}>
                  {new Date(slot).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={book}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
        >
          ✅ Book Now
        </button>
      </div>
    </div>
  );
};

export default BookAppointment;
