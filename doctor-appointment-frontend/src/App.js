import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import BookAppointment from './pages/BookAppointment';

function ProtectedRoute({ children, allowRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/" />;
  if (allowRole && role !== allowRole) return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/" element={!token ? <LoginPage /> : <Navigate to="/dashboard" />} />

        <Route
          path="/dashboard"
          element={
            token ? (
              role === 'doctor' ? <Navigate to="/doctor" /> : <Navigate to="/patient" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
