import React from 'react';
import CalendarView from './CalendarView';
import AppointmentModal from './AppointmentModal';
import NewAppointmentModal from './NewAppointmentModal';

const ScheduleTab = ({
  appointments,
  selectedAppointment,
  setSelectedAppointment,
  newAppointment,
  setNewAppointment,
  patients,
  fetchAppointments,
  view,
  setView,
  date,
  setDate,
  handleNavigate,
}) => {
  const handleSlotSelect = (slotInfo) => {
    const selectedDate = new Date(slotInfo.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset time for comparison

    if (selectedDate < today) {
      alert('יש לבחור תאריך עתידי ⛔');
      return;
    }

    setNewAppointment({
      start: selectedDate,
      end: new Date(selectedDate.getTime() + 30 * 60000),
      patientId: '',
    });
  };

  return (
    <div>
      
      <CalendarView
        appointments={appointments}
        view={view}
        setView={setView}
        date={date}
        setDate={setDate}
        onSelectEvent={setSelectedAppointment}
        onSelectSlot={handleSlotSelect}
        min={new Date()} // ⛔ disables time slots earlier than now
      />

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          setAppointment={setSelectedAppointment}
          fetchAppointments={fetchAppointments}
        />
      )}

      {newAppointment && (
        <NewAppointmentModal
          appointment={newAppointment}
          setAppointment={setNewAppointment}
          patients={patients}
          fetchAppointments={fetchAppointments}
        />
      )}
    </div>
  );
};

export default ScheduleTab;
