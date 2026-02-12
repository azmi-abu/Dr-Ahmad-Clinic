import React, { useMemo, useState } from "react";
import api from "../../services/api";

const FORMS = [
  { key: "botox", label: "טופס הסכמה לטיפול בוטוקס" },
  { key: "hyaluronic", label: "טופס הסכמה לטיפול חומצה הלריונית" },
  { key: "sculptra", label: "טופס הסכמה לטיפול בסקולפטרא" },
  { key: "salmon", label: "טופס הסכמה לטיפול בזרע סלמון" },
];

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const HistoryTab = ({ patients, fetchPatients }) => {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [uploadingKey, setUploadingKey] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const selectedPatient = useMemo(
    () => patients.find((p) => p._id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleUploadForm = async (formKey, file) => {
  if (!selectedPatientId) return;

  try {
    setUploadingKey(formKey);
    setMsg({ type: "", text: "" });

    if (file.size > 8 * 1024 * 1024) {
      showMsg("bad", "❌ הקובץ גדול מדי (מקסימום 8MB)");
      return;
    }

    const base64 = await fileToBase64(file);

    await api.put(
      `/patients/${selectedPatientId}/forms/${formKey}`,
      {
        fileBase64: base64,
        filename: file.name,
        mimeType: file.type || "application/pdf",
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    // 🔥 HERE — refresh patients from server
    await fetchPatients();

    showMsg("ok", "✅ הטופס הועלה בהצלחה");
  } catch (err) {
    console.error(err);
    showMsg("bad", "❌ העלאת טופס נכשלה");
  } finally {
    setUploadingKey("");
  }
};


  const handleDownloadForm = async (formKey) => {
    if (!selectedPatientId) return;

    try {
      const res = await api.get(`/patients/${selectedPatientId}/forms/${formKey}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${formKey}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      showMsg("bad", "❌ הורדה נכשלה או שהטופס לא קיים");
    }
  };

  const patientLabel = (p) => `${p.name} (${p.phone})`;

  return (
    <div className="card card-pad">

      <div className="field">
        <label>בחר מטופל</label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">בחר מטופל...</option>
          {patients.map((p) => (
            <option key={p._id} value={p._id}>
              {patientLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === "ok" ? "ok" : "bad"}`}>
          {msg.text}
        </div>
      )}

      {!selectedPatientId && (
        <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 800 }}>
          בחר מטופל כדי להעלות/להוריד טפסים.
        </div>
      )}

      {selectedPatientId && !selectedPatient && (
        <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 800 }}>
          מטופל לא נמצא.
        </div>
      )}

      {selectedPatient && (
        <div style={{ marginTop: 16 }}>
          {/* Patient header */}
          <div className="patient-card">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar">
                {selectedPatient.profileImage?.data ? (
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
                  {selectedPatient.name}
                </div>
                <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13 }}>
                  {selectedPatient.phone}
                </div>
              </div>
            </div>

            <div className="badge">
              {FORMS.filter((f) => !!selectedPatient.consentForms?.[f.key]?.data).length}
              /{FORMS.length} טפסים הועלו
            </div>
          </div>

          {/* Forms list */}
          <div style={{ marginTop: 14 }}>
            <div className="section-title">רשימת טפסים</div>

            <div style={{ display: "grid", gap: 10 }}>
              {FORMS.map((f) => {
                const hasFile = !!selectedPatient.consentForms?.[f.key]?.data;

                return (
                  <div key={f.key} className="form-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`badge ${hasFile ? "ok" : "no"}`}>
                        {hasFile ? "✅ קיים" : "❌ חסר"}
                      </span>
                      <div style={{ fontWeight: 900 }}>{f.label}</div>
                    </div>

                    <div className="form-actions">
                      {/* Upload */}
                      <label className="btn btn-soft btn-small" style={{ cursor: "pointer" }}>
                        {uploadingKey === f.key ? "מעלה..." : "העלה קובץ"}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          style={{ display: "none" }}
                          disabled={uploadingKey === f.key}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleUploadForm(f.key, file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {/* Download */}
                      {hasFile ? (
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => handleDownloadForm(f.key)}
                        >
                          הורד
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)", fontWeight: 900, fontSize: 13 }}>
                          אין קובץ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, color: "var(--muted)", fontWeight: 800, fontSize: 13 }}>
              * ניתן להעלות PDF או תמונה. גודל מקסימלי: 8MB
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
