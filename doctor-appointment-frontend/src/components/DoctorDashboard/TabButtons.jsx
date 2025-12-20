import React from 'react';

const TabButtons = ({ tabs, activeTab, setActiveTab }) => (
  <div className="flex gap-4 mb-6 flex-wrap">
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => setActiveTab(t.key)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition shadow ${
          activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

export default TabButtons;
