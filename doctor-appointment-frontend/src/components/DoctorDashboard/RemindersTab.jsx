import React, { useMemo, useState } from "react";
import api from "../../services/api";

const RemindersTab = ({ appointments = [], fetchAppointments }) => {
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const addDays = (d, n) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

  const formatDayHeader = (d) =>
    new Date(d).toLocaleDateString("he-IL", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const formatDateTime = (d) => {
    const dt = new Date(d);
    return dt.toLocaleString("he-IL", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildMessage = (a) => {
    const patientName = a?.patient?.name || "מטופל/ת";
    const when = formatDateTime(a.start);
    const type = a?.type || "תור";

    return `שלום ${patientName} 😊
תזכורת לתור הקרוב: ${type}
מועד: ${when}

אם צריך לשנות/לבטל – אנא הודע/י לנו.`;
  };

  const sendReminder = async (appointmentId) => {
    try {
      setSendingId(appointmentId);
      setToast("");

      await api.post(
        "/notifications/whatsapp/appointment-reminder",
        { appointmentId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setToast("✅ התזכורת נשלחה בוואטסאפ");
      await fetchAppointments?.();
    } catch (err) {
      const msg = err?.response?.data?.message || "❌ שליחת התזכורת נכשלה";
      setToast(msg);
    } finally {
      setSendingId(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  // Build 7-day window buckets (today..+6)
  const { days, rowsByDayKey, totalUpcoming } = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const end = addDays(today, 7); // exclusive end

    const filtered = (appointments || [])
      .filter((a) => a?.start)
      .map((a) => ({ ...a, _startDate: new Date(a.start) }))
      .filter((a) => a._startDate >= today && a._startDate < end)
      .sort((a, b) => a._startDate - b._startDate);

    const daysArr = Array.from({ length: 7 }, (_, i) => addDays(today, i));

    const map = {};
    daysArr.forEach((d) => {
      const key = startOfDay(d).toISOString();
      map[key] = [];
    });

    filtered.forEach((a) => {
      const key = startOfDay(a._startDate).toISOString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    return {
      days: daysArr,
      rowsByDayKey: map,
      totalUpcoming: filtered.length,
    };
  }, [appointments]);

  const TypeBadge = ({ type }) => {
    const label = type || "—";
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        {label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">תזכורות וואטסאפ</h2>
          <p className="text-sm text-gray-600 mt-1">
            תצוגת שבוע (כולל היום): כל התורים מוצגים לפי יום ובסדר כרונולוגי.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-gray-500">סה״כ תורים בשבוע הקרוב</div>
          <div className="text-2xl font-extrabold text-gray-800">{totalUpcoming}</div>
        </div>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 border text-sm flex items-center justify-between gap-3">
          <div>{toast}</div>
          <button
            onClick={() => setToast("")}
            className="text-gray-500 hover:text-gray-800 text-xs"
          >
            סגור
          </button>
        </div>
      )}

      {totalUpcoming === 0 ? (
        <div className="text-gray-600 text-sm">אין תורים ב-7 הימים הקרובים.</div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => {
            const dayKey = startOfDay(day).toISOString();
            const rows = rowsByDayKey[dayKey] || [];
            const isToday =
              startOfDay(day).getTime() === startOfDay(new Date()).getTime();

            return (
              <div key={dayKey} className="border rounded-2xl overflow-hidden">
                {/* Day Header */}
                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-800">{formatDayHeader(day)}</div>
                    {isToday && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                        היום
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {rows.length} תורים
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white">
                      <tr className="text-gray-500 border-b">
                        <th className="text-right font-semibold px-4 py-3">שעה</th>
                        <th className="text-right font-semibold px-4 py-3">מטופל/ת</th>
                        <th className="text-right font-semibold px-4 py-3">סוג תור</th>
                        <th className="text-right font-semibold px-4 py-3">פעולות</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-gray-500" colSpan={4}>
                            אין תורים ביום הזה.
                          </td>
                        </tr>
                      ) : (
                        rows.map((a) => {
                          const id = a._id || a.id;
                          const patientName = a?.patient?.name || "Unknown";
                          const patientPhone = a?.patient?.phone || "—";
                          const type = a?.type || "";
                          const whenTime = formatTime(a.start);
                          const open = expandedId === id;

                          return (
                            <React.Fragment key={id}>
                              <tr className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-800">
                                  {whenTime}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-semibold text-gray-800">
                                    {patientName}
                                  </div>
                                  <div className="text-xs text-gray-500">{patientPhone}</div>
                                </td>

                                <td className="px-4 py-3">
                                  <TypeBadge type={type} />
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() =>
                                        setExpandedId(open ? null : id)
                                      }
                                      className="px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-gray-50 text-gray-700"
                                    >
                                      {open ? "הסתר הודעה" : "תצוגת הודעה"}
                                    </button>

                                    <button
                                      onClick={() => sendReminder(id)}
                                      disabled={sendingId === id}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-white transition
                                        ${
                                          sendingId === id
                                            ? "bg-gray-400"
                                            : "bg-green-600 hover:bg-green-700"
                                        }`}
                                    >
                                      {sendingId === id ? "שולח..." : "שלח וואטסאפ"}
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {open && (
                                <tr className="border-b bg-gray-50">
                                  <td colSpan={4} className="px-4 py-4">
                                    <div className="rounded-xl border bg-white p-3">
                                      <div className="text-xs font-bold text-gray-500 mb-2">
                                        תוכן ההודעה (Preview)
                                      </div>
                                      <div className="whitespace-pre-line text-gray-800 text-sm">
                                        {buildMessage(a)}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RemindersTab;
