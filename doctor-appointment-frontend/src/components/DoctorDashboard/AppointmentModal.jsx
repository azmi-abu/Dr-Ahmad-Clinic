import React, { useEffect, useState } from 'react';
import moment from 'moment';
import api from '../../services/api';

const AppointmentModal = ({ appointment, setAppointment, fetchAppointments }) => {
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const response = await api.get('/appointments/treatments');
        setTreatments(response.data);
      } catch (err) {
        console.error('Failed to load treatments:', err);
      }
    };
    fetchTreatments();
  }, []);

  const handleSave = async () => {
    if (!appointment.type) {
      alert('Please select a treatment type.');
      return;
    }

    try {
      await api.put(`/appointments/${appointment._id}`, {
        date: appointment.start,
        type: appointment.type,
      });

      setAppointment(null);
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment. Check console for details.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/appointments/${appointment._id}`);
      setAppointment(null);
      fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAppointment(null);
      } else if (e.key === 'Enter') {
        if (appointment.type) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [appointment.type, handleSave]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Appointment</h2>

        <p><strong>Patient:</strong> {appointment.patient?.name}</p>

        <label className="block mt-4">Treatment Type:</label>
        <select
          value={appointment.type || ''}
          onChange={(e) => setAppointment({ ...appointment, type: e.target.value })}
          className="border rounded p-2 w-full"
        >
          <option value="">Select treatment...</option>
          {treatments.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label className="block mt-4">Date & Time:</label>
        <input
          type="datetime-local"
          className="border rounded p-2 w-full"
          value={moment(appointment.start).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) =>
            setAppointment({
              ...appointment,
              start: new Date(e.target.value),
              end: new Date(new Date(e.target.value).getTime() + 30 * 60000),
            })
          }
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!appointment.type}
          >
            Save
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Cancel Appointment
          </button>
          <button
            onClick={() => setAppointment(null)}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
