import React from "react";

const DashboardLayout = ({ children, onLogout }) => (
  <div className="app-shell">
    <div className="app-container">
      <div className="header">
        <div className="title">דשבורד - ד"ר אחמד אבו אחמד</div>

        <button onClick={onLogout} className="logout">
          התנתקות
        </button>
      </div>

      <div className="card card-pad">{children}</div>
    </div>
  </div>
);

export default DashboardLayout;
