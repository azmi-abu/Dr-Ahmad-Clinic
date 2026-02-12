import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarView = ({ appointments, view, setView, date, setDate, onSelectEvent, onSelectSlot }) => (
  <div style={{ background: "white", borderRadius: 16, padding: 16, border: "1px solid #e2e8f0" }}>
  <Calendar
    localizer={localizer}
    events={appointments}
    startAccessor="start"
    endAccessor="end"
    defaultView={view}
    onView={setView}
    view={view}
    date={date}
    onNavigate={setDate}
    style={{ height: 500, backgroundColor: 'white', borderRadius: '1rem', padding: '1rem' }}
    selectable
    onSelectEvent={onSelectEvent}
    onSelectSlot={onSelectSlot}
  />
  </div>
);

export default CalendarView;
