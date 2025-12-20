import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DoctorDashboard/DashboardLayout';
import TabButtons from '../components/DoctorDashboard/TabButtons';
import ScheduleTab from '../components/DoctorDashboard/ScheduleTab';
import AddPatientTab from '../components/DoctorDashboard/AddPatientTab';
import HistoryTab from '../components/DoctorDashboard/HistoryTab';

import {
  FaCalendarAlt,
  FaHistory,
  FaFileInvoice,
  FaPrescriptionBottle,
  FaUserPlus,
} from 'react-icons/fa';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [newPatient, setNewPatient] = useState({ name: '', phone: '' });
  const [addMessage, setAddMessage] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/doctor', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const formatted = res.data.map(a => ({
        ...a,
        title: `${a.patient?.name || 'Unknown'} - ${a.type}`,
        start: new Date(a.date),
        end: new Date(new Date(a.date).getTime() + 30 * 60000),
      }));
      setAppointments(formatted);
    } catch (err) {
      console.error('Failed to fetch doctor appointments:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const handleNavigate = (action) => {
    const newDate = new Date(date);
    if (action === 'PREV') newDate.setMonth(newDate.getMonth() - 1);
    else if (action === 'NEXT') newDate.setMonth(newDate.getMonth() + 1);
    setDate(newDate);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(newPatient.phone)) {
      setAddMessage('❌ Phone number must start with 05 and be 10 digits');
      setTimeout(() => setAddMessage(''), 3000);
      return;
    }
    try {
      await api.post('/patients', newPatient, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAddMessage('✅ Patient added successfully!');
      setNewPatient({ name: '', phone: '' });
      fetchPatients();
    } catch (err) {
      setAddMessage(err.response?.data?.message || '❌ Failed to add patient.');
    }
    setTimeout(() => setAddMessage(''), 3000);
  };

  const tabs = [
    { key: 'schedule', label: 'Schedule', icon: <FaCalendarAlt /> },
    { key: 'history', label: 'History', icon: <FaHistory /> },
    { key: 'invoice', label: 'חשבונית ירוקה', icon: <FaFileInvoice /> },
    { key: 'prescription', label: 'רושטה', icon: <FaPrescriptionBottle /> },
    { key: 'add', label: 'הוספת מטופלים', icon: <FaUserPlus /> },
  ];

  return (
    <DashboardLayout
      onLogout={() => {
        localStorage.clear();
        window.location.href = '/';
      }}
    >
      <TabButtons tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'schedule' && (
        <ScheduleTab
          appointments={appointments}
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
          newAppointment={newAppointment}
          setNewAppointment={setNewAppointment}
          patients={patients}
          fetchAppointments={fetchAppointments}
          view={view}
          setView={setView}
          date={date}
          setDate={setDate}
          handleNavigate={handleNavigate}
        />
      )}

      {activeTab === 'add' && (
        <AddPatientTab
          newPatient={newPatient}
          setNewPatient={setNewPatient}
          handleAddPatient={handleAddPatient}
          addMessage={addMessage}
        />
      )}
      {activeTab === 'history' && (
  <HistoryTab patients={patients} />
      )}
    </DashboardLayout>
  );
};

export default DoctorDashboard;
