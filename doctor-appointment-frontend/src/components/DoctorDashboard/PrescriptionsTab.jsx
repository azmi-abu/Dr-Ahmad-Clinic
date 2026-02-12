import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import api from "../../services/api";

const PrescriptionsTab = ({ patients }) => {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [mode, setMode] = useState("create"); // "create" | "list"

  const [list, setList] = useState([]);
  const [title, setTitle] = useState("מרשם");
  const [notes, setNotes] = useState("");

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");

  const selectedPatient = useMemo(
    () => patients.find((p) => p._id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 2500);
  };

  const fetchPrescriptions = async (patientId) => {
    try {
      setLoading(true);
      const res = await api.get(`/prescriptions/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setList(res.data || []);
    } catch (err) {
      console.error("Fetch prescriptions error:", err);
      setList([]);
      showMsg("bad", "❌ טעינת מרשמים נכשלה");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) fetchPrescriptions(selectedPatientId);
    else setList([]);

    // reset view when changing patient
    setMode("create");
  }, [selectedPatientId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });

      const res = await api.post(
        `/prescriptions`,
        { patientId: selectedPatientId, title, notes },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setList((prev) => [res.data, ...prev]);
      setNotes("");
      setTitle("מרשם");
      showMsg("ok", "✅ המרשם נשמר בהצלחה");

      // switch to list after saving (better UX)
      setMode("list");
    } catch (err) {
      console.error(err);
      showMsg("bad", "❌ שמירת מרשם נכשלה");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/prescriptions/item/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setList((prev) => prev.filter((x) => x._id !== id));
      showMsg("ok", "✅ המרשם נמחק");
    } catch (err) {
      console.error(err);
      showMsg("bad", "❌ מחיקה נכשלה");
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      setDownloadingId(id);
      setMsg({ type: "", text: "" });

      const res = await api.get(`/prescriptions/item/${id}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      showMsg("ok", "✅ PDF ירד בהצלחה");
    } catch (err) {
      console.error("Download PDF error:", err);
      showMsg("bad", "❌ הורדת PDF נכשלה");
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="card card-pad">
      <div className="section-title">מרשמים</div>

      <div className="field">
        <label>בחר מטופל</label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">בחר מטופל...</option>
          {patients.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.phone})
            </option>
          ))}
        </select>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === "ok" ? "ok" : "bad"}`}>
          {msg.text}
        </div>
      )}

      {!selectedPatientId ? (
        <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 800 }}>
          בחר מטופל כדי ליצור/לראות מרשמים.
        </div>
      ) : (
        <>
          {/* TOP SWITCH BUTTONS */}
          <div style={{ display: "flex", gap: 10, marginTop: 10, marginBottom: 16 }}>
            <button
              type="button"
              className={`tab ${mode === "create" ? "active" : ""}`}
              onClick={() => setMode("create")}
            >
              ➕ הוספת מרשם
            </button>

            <button
              type="button"
              className={`tab ${mode === "list" ? "active" : ""}`}
              onClick={() => setMode("list")}
            >
              📄 צפייה במרשמים קיימים
            </button>
          </div>

          {/* PATIENT HEADER */}
          {/* PATIENT HEADER (with image) */}
<div className="patient-card" style={{ marginBottom: 14 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div className="avatar">
      {selectedPatient?.profileImage?.data ? (
        <img
          src={selectedPatient.profileImage.data}
          alt={selectedPatient.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        "No image"
      )}
    </div>

    <div>
      <div style={{ fontWeight: 1000, fontSize: 16 }}>
        {selectedPatient?.name || "—"}
      </div>
      <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13 }}>
        {selectedPatient?.phone || ""}
      </div>
    </div>
  </div>

  <div className="badge">{list.length} מרשמים קיימים</div>
</div>


          {/* CREATE MODE */}
          {mode === "create" && (
            <div className="item-card">
              <div className="section-title">הוספת מרשם חדש</div>

              <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="כותרת (למשל: מרשם)"
                />

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  style={{ minHeight: 130 }}
                  placeholder="כתוב מרשם / הוראות טיפול... (איפה למרוח, כמה פעמים ביום, כמה זמן וכו')"
                  required
                />

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "שומר..." : "שמור מרשם"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST MODE */}
          {mode === "list" && (
            <div style={{ marginTop: 12 }}>
              <div className="section-title">מרשמים קיימים</div>

              {loading ? (
                <div className="meta">טוען...</div>
              ) : list.length > 0 ? (
                <div className="list-grid">
                  {list.map((p) => (
                    <div key={p._id} className="item-card">
                      <div className="row">
                        <div style={{ fontWeight: 1000, fontSize: 16 }}>
                          {p.title || "מרשם"}
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-small"
                            onClick={() => handleDownloadPdf(p._id)}
                            disabled={downloadingId === p._id}
                          >
                            {downloadingId === p._id ? "מוריד..." : "הורד PDF"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={() => handleDelete(p._id)}
                          >
                            מחק
                          </button>
                        </div>
                      </div>

                      <div className="meta" style={{ marginTop: 6 }}>
                        {moment(p.createdAt).format("LLL")}
                      </div>

                      <div className="notes-box">{p.notes}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="meta">אין מרשמים למטופל זה.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrescriptionsTab;
