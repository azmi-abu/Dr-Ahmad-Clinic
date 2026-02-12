import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import api from '../../services/api';

const NewAppointmentModal = ({
  appointment,
  setAppointment,
  patients,
  fetchAppointments,
}) => {
  const [treatments, setTreatments] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    const fetchTreatments = async () => {
      const res = await api.get('/appointments/treatments');
      setTreatments(res.data);
    };
    fetchTreatments();
  }, []);

  const dateStr = useMemo(
    () => moment(appointment.start).format('YYYY-MM-DD'),
    [appointment]
  );
  const timeStr = useMemo(
    () => moment(appointment.start).format('HH:mm'),
    [appointment]
  );

  const validate = () => {
    const now = moment();
    const selected = moment(appointment.start);

    const nextErrors = {
      patientId: !appointment.patientId ? 'נא לבחור מטופל' : '',
      type: !appointment.type ? 'נא לבחור טיפול' : '',
      date: !dateStr || dateStr === 'Invalid date' ? 'חסר תאריך' : '',
      time: !timeStr || timeStr === 'Invalid date' ? 'חסר שעה' : '',
      past:
        selected.isBefore(now)
          ? '❌ לא ניתן לקבוע תור בעבר'
          : '',
    };

    // merge date/time past error into date field visually
    if (nextErrors.past) {
      nextErrors.date = nextErrors.past;
      nextErrors.time = nextErrors.past;
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setTimeout(() => setErrors({}), 2000);
    }

    return !Object.values(nextErrors).some(Boolean);
  };

  const markAllTouched = () => {
    setTouched({
      patientId: true,
      type: true,
      date: true,
      time: true,
    });
  };

  const errorClass = (field) =>
    touched[field] && errors[field]
      ? 'border-red-500 animate-shake'
      : '';

  const handleAdd = async () => {
    markAllTouched();

    if (!validate()) {
      setShakeKey((k) => k + 1);
      return;
    }

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAppointment(null);
      } else if (e.key === 'Enter') {
        handleAdd();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [appointment]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">הוסף טיפול</h2>

        {/* Patient */}
        <label>שם המטופל</label>
        <select
          key={`patient-${shakeKey}`}
          value={appointment.patientId}
          onChange={(e) => {
            setTouched((t) => ({ ...t, patientId: true }));
            setAppointment({ ...appointment, patientId: e.target.value });
          }}
          className={`w-full border p-2 rounded mt-2 ${errorClass('patientId')}`}
        >
          <option value="">בחר מטופל</option>
          {patients.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        {touched.patientId && errors.patientId && (
          <p className="text-red-600 font-bold text-xs mt-1">
            {errors.patientId}
          </p>
        )}

        {/* Treatment */}
        <label className="block mt-4">סוג הטיפול</label>
        <select
          key={`type-${shakeKey}`}
          value={appointment.type || ''}
          onChange={(e) => {
            setTouched((t) => ({ ...t, type: true }));
            setAppointment({ ...appointment, type: e.target.value });
          }}
          className={`w-full border p-2 rounded ${errorClass('type')}`}
        >
          <option value="">בחר טיפול </option>
          {treatments.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {touched.type && errors.type && (
          <p className="text-red-600 font-bold text-xs mt-1">
            {errors.type}
          </p>
        )}

        {/* Date */}
        <label className="block mt-4">תאריך</label>
        <input
          key={`date-${shakeKey}`}
          type="date"
          min={moment().format('YYYY-MM-DD')} // ⛔ block past days
          value={dateStr}
          onChange={(e) => {
            setTouched((t) => ({ ...t, date: true }));
            const [y, m, d] = e.target.value.split('-');
            const updated = new Date(appointment.start);
            updated.setFullYear(+y, +m - 1, +d);
            setAppointment({
              ...appointment,
              start: updated,
              end: new Date(updated.getTime() + 30 * 60000),
            });
          }}
          className={`w-full border p-2 rounded ${errorClass('date')}`}
        />
        {touched.date && errors.date && (
          <p className="text-red-600 font-bold text-xs mt-1">
            {errors.date}
          </p>
        )}

        {/* Time */}
        <label className="block mt-4">שעה</label>
        <input
          key={`time-${shakeKey}`}
          type="time"
          value={timeStr}
          onChange={(e) => {
            setTouched((t) => ({ ...t, time: true }));
            const [h, min] = e.target.value.split(':');
            const updated = new Date(appointment.start);
            updated.setHours(+h, +min);
            setAppointment({
              ...appointment,
              start: updated,
              end: new Date(updated.getTime() + 30 * 60000),
            });
          }}
          className={`w-full border p-2 rounded ${errorClass('time')}`}
        />
        {touched.time && errors.time && (
          <p className="text-red-600 font-bold text-xs mt-1">
            {errors.time}
          </p>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            הוספה
          </button>
          <button
            onClick={() => setAppointment(null)}
            className="px-4 py-2 text-gray-600 hover:underline"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentModal;
