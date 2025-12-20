import React, { useEffect, useState } from 'react';
import moment from 'moment';
import api from '../../services/api';

const NewAppointmentModal = ({ appointment, setAppointment, patients, fetchAppointments }) => {
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    const fetchTreatments = async () => {
      const res = await api.get('/appointments/treatments');
      setTreatments(res.data);
    };
    fetchTreatments();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAppointment(null); // Close modal
      } else if (e.key === 'Enter') {
        if (appointment.patientId && appointment.type) {
          handleAdd(); // Submit
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [appointment]);
  
  const handleAdd = async () => {
    await api.post(
      '/appointments',
      {
        patientId: appointment.patientId,
        date: appointment.start,
        type: appointment.type,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    setAppointment(null);
    fetchAppointments();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Appointment</h2>

        <label>Select Patient:</label>
        <select
          value={appointment.patientId}
          onChange={(e) => setAppointment({ ...appointment, patientId: e.target.value })}
          className="w-full border p-2 rounded mt-2"
        >
          <option value="">Select...</option>
          {patients.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <label className="block mt-4">Treatment:</label>
        <select
          value={appointment.type || ''}
          onChange={(e) => setAppointment({ ...appointment, type: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="">Select treatment...</option>
          {treatments.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="block mt-4">Date:</label>
        <input
          type="date"
          className="w-full border p-2 rounded"
          value={moment(appointment.start).format('YYYY-MM-DD')}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-');
            const updated = new Date(appointment.start);
            updated.setFullYear(y, m - 1, d);
            setAppointment({
              ...appointment,
              start: updated,
              end: new Date(updated.getTime() + 30 * 60000),
            });
          }}
        />

        <label className="block mt-4">Time:</label>
        <input
          type="time"
          className="w-full border p-2 rounded"
          value={moment(appointment.start).format('HH:mm')}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(':');
            const updated = new Date(appointment.start);
            updated.setHours(+hours, +minutes);
            setAppointment({
              ...appointment,
              start: updated,
              end: new Date(updated.getTime() + 30 * 60000),
            });
          }}
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!appointment.patientId || !appointment.type}
          >
            Add
          </button>
          <button
            onClick={() => setAppointment(null)}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentModal;
