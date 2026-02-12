import React, { useState } from "react";

const isValidName = (name) => /^[A-Za-z\u0590-\u05FF\s]+$/.test(name.trim());
const isValidPhone = (phone) => /^05\d{8}$/.test(phone); // 10 digits, starts with 05

const AddPatientTab = ({
  newPatient,
  setNewPatient,
  handleAddPatient,
  addMessage,
}) => {
  const [preview, setPreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", phone: "" });

  const handlePickFile = (file) => {
    if (!file) return;

    // limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("הקובץ גדול מדי (מקסימום 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result; // data:image/...;base64,...
      setImageBase64(base64);
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const nameOk = isValidName(newPatient.name);
    const phoneOk = isValidPhone(newPatient.phone);

    const nextErrors = {
      name: nameOk ? "" : "שם יכול להכיל אותיות ורווחים בלבד",
      phone: phoneOk ? "" : "מספר טלפון חייב להיות 10 ספרות ולהתחיל ב־05",
    };
    setErrors(nextErrors);

    if (!nameOk || !phoneOk) return;

    try {
      setLoading(true);
      await handleAddPatient(e, imageBase64);

      // clear preview on success (your handler already clears form fields)
      setPreview("");
      setImageBase64("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-pad">
      <div className="section-title">הוספת מטופל חדש</div>

      {addMessage && (
        <div className={`alert ${addMessage.includes("✅") ? "ok" : "bad"}`}>
          {addMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid" style={{ gap: 14 }}>
        {/* Inputs */}
        <div
          className="grid"
          style={{
            gap: 12,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          {/* FULL NAME */}
          <div className="field">
            <label>שם מלא</label>
            <input
              className={`input ${errors.name ? "input-error" : ""}`}
              placeholder="הכנס שם מלא"
              value={newPatient.name}
              onChange={(e) => {
                const value = e.target.value;
                setNewPatient({ ...newPatient, name: value });

                setErrors((prev) => ({
                  ...prev,
                  name:
                    value && !isValidName(value)
                      ? "שם יכול להכיל אותיות ורווחים בלבד"
                      : "",
                }));
              }}
              required
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          {/* PHONE */}
          <div className="field">
            <label>טלפון</label>
            <input
              className={`input ${errors.phone ? "input-error" : ""}`}
              placeholder="05XXXXXXXX"
              value={newPatient.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10); // digits only, max 10
                setNewPatient({ ...newPatient, phone: value });

                setErrors((prev) => ({
                  ...prev,
                  phone:
                    value && !isValidPhone(value)
                      ? "מספר טלפון חייב להיות 10 ספרות ולהתחיל ב־05"
                      : "",
                }));
              }}
              inputMode="numeric"
              maxLength={10}
              required
            />
            {errors.phone && <div className="error-text">{errors.phone}</div>}
          </div>
        </div>

        {/* Image Upload */}
        <div className="item-card">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>תמונת מטופל</div>
              <div className="meta">PNG/JPG – עד 5MB</div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <label className="btn btn-primary btn-small" style={{ cursor: "pointer" }}>
                העלאת תמונה
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handlePickFile(e.target.files?.[0])}
                />
              </label>

              {preview ? (
                <div className="avatar" style={{ width: 56, height: 56 }}>
                  <img
                    src={preview}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div className="avatar" style={{ width: 56, height: 56, color: "var(--muted)" }}>
                  No image
                </div>
              )}

              {(preview || imageBase64) && (
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => {
                    setPreview("");
                    setImageBase64("");
                  }}
                >
                  הסר
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "מוסיף..." : "הוסף מטופל"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientTab;
