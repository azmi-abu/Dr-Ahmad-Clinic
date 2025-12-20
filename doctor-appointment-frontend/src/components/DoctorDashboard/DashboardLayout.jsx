import React from 'react';

const DashboardLayout = ({ children, onLogout }) => (
  <div className="min-h-screen bg-gray-50 px-6 py-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-3xl font-bold text-blue-800">Doctor Dashboard</h2>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
    {children}
  </div>
);

export default DashboardLayout;
