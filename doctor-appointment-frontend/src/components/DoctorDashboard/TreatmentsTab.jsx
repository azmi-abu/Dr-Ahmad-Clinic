import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import moment from "moment";

const TreatmentsTab = ({ patients }) => {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedPatient = useMemo(
    () => patients.find((p) => p._id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const fetchHistory = async (patientId) => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments/history/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const sorted = res.data
        .filter((appt) => appt.status !== "cancelled")
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(sorted);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) fetchHistory(selectedPatientId);
    else setHistory([]);
  }, [selectedPatientId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold text-blue-800 mb-4">טיפולים קודמים</h2>

      <label className="block mb-2 font-medium">:בחר מטופל</label>
      <select
        value={selectedPatientId}
        onChange={(e) => setSelectedPatientId(e.target.value)}
        className="border p-2 rounded mb-4 w-full"
      >
        <option value="">..בחר</option>
        {patients.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name} ({p.phone})
          </option>
        ))}
      </select>

      {selectedPatient ? (
        <div className="mb-4 text-sm text-gray-600">
          מציג טיפולים עבור: <span className="font-semibold">{selectedPatient.name}</span>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-600">טוען...</p>
      ) : history.length > 0 ? (
        <ul className="divide-y">
          {history.map((appt) => {
            const isPast = moment(appt.date).isBefore(moment());
            const displayStatus = isPast ? "הושלם" : appt.status;

            return (
              <li key={appt._id} className="py-3 flex flex-col gap-1">
                <div className="text-sm sm:text-base">
                  <strong>{appt.type}</strong>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {moment(appt.date).format("LLL")}
                </div>
                <div className="text-xs sm:text-sm">
                  סטטוס:{" "}
                  <span className={displayStatus === "הושלם" ? "text-gray-600" : "text-green-600"}>
                    {displayStatus}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : selectedPatientId ? (
        <p className="text-sm text-gray-600">אין למטופל זה היסטוריית טיפולים.</p>
      ) : (
        <p className="text-sm text-gray-600">בחר מטופל כדי לראות היסטוריה.</p>
      )}
    </div>
  );
};

export default TreatmentsTab;
