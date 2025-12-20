import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import moment from 'moment';
import {
  FaBell,
  FaEdit,
  FaFileInvoice,
  FaPrescriptionBottleAlt,
} from 'react-icons/fa';

const HistoryTab = ({ patients }) => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [history, setHistory] = useState([]);

  const fetchHistory = async (patientId) => {
    try {
      const res = await api.get(`/appointments/history/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // Remove cancelled and sort by date ascending
      const sorted = res.data
        .filter((appt) => appt.status !== 'cancelled')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setHistory(sorted);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    if (selectedPatientId) fetchHistory(selectedPatientId);
  }, [selectedPatientId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold text-blue-800 mb-4">Patient History</h2>
  
      <label className="block mb-2 font-medium">:בחר מטופל</label>
      <select
        value={selectedPatientId}
        onChange={(e) => setSelectedPatientId(e.target.value)}
        className="border p-2 rounded mb-4 w-full"
      >
        <option value="">Select...</option>
        {patients.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>
  
      {history.length > 0 ? (
        <ul className="divide-y">
          {history.map((appt) => {
            const isPast = moment(appt.date).isBefore(moment());
            const displayStatus = isPast ? 'Completed' : appt.status;
  
            return (
                <li
                key={appt._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
              >
                <div className="text-sm sm:text-base flex-1">
                  <strong>{appt.type}</strong> — {moment(appt.date).format('LLL')} —{' '}
                  <span
                    className={
                      displayStatus === 'Completed'
                        ? 'text-gray-600'
                        : 'text-green-600'
                    }
                  >
                    {displayStatus}
                  </span>
                </div>
              
                <div className="flex gap-2 text-xl sm:ml-4">
                  {displayStatus === 'Completed' ? (
                    <>
                      <FaFileInvoice
                        title="חשבונית ירוקה"
                        className="text-blue-700 cursor-pointer"
                      />
                      <FaPrescriptionBottleAlt
                        title="רושטה"
                        className="text-purple-600 cursor-pointer"
                      />
                    </>
                  ) : (
                    <>
                      <FaBell
                        title="שלח תזכורת"
                        className="text-yellow-500 cursor-pointer"
                      />
                      <FaEdit
                        title="ערוך"
                        className="text-gray-700 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </li>
              
            );
          })}
        </ul>
      ) : (
        selectedPatientId && <p>אין למטופל זה היסטוריית טיפולים.</p>
      )}
    </div>
  );  
};

export default HistoryTab;
