import React from 'react';

const TabButtons = ({ tabs, activeTab, setActiveTab }) => (
  <div className="tabs">
  {tabs.map(t => (
    <button
      key={t.key}
      className={`tab ${activeTab === t.key ? "active" : ""}`}
      onClick={() => setActiveTab(t.key)}
    >
      {t.icon}
      {t.label}
    </button>
  ))}
</div>
);

export default TabButtons;
