const Prescription = require("../models/Prescription");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// =========================================================
// ✅ Font helper
// =========================================================
function trySetFont(doc, fontPath, fontName) {
  try {
    if (!fontPath) return false;
    if (!fs.existsSync(fontPath)) return false;
    doc.registerFont(fontName, fontPath);
    doc.font(fontName);
    return true;
  } catch (e) {
    return false;
  }
}

// =========================================================
// ✅ create
// =========================================================
exports.createPrescription = async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Access denied" });

    const { patientId, title, notes } = req.body;
    if (!patientId || !notes?.trim()) {
      return res.status(400).json({ message: "patientId and notes are required" });
    }

    const patient = await User.findById(patientId).select("name phone role");
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found" });
    }

    const created = await Prescription.create({
      doctor: req.user.id,
      patient: patientId,
      title: title?.trim() || "מרשם",
      notes: notes.trim(),
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("createPrescription error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================================
// ✅ list
// =========================================================
exports.getMyPatientPrescriptions = async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Access denied" });

    const { patientId } = req.params;

    const list = await Prescription.find({
      doctor: req.user.id,
      patient: patientId,
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("getMyPatientPrescriptions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================================
// ✅ delete
// =========================================================
exports.deletePrescription = async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Access denied" });

    const item = await Prescription.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (item.doctor.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    await item.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deletePrescription error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================================================
// ✅ PDF download (Hebrew RTL + correct numbers order)
// =========================================================
exports.downloadPrescriptionPdf = async (req, res) => {
  let doc = null;
  let ended = false;

  const safeEnd = () => {
    if (ended) return;
    ended = true;
    try {
      if (doc && !doc.ended) doc.end();
    } catch {}
  };

  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Access denied" });

    const item = await Prescription.findById(req.params.id).populate("patient", "name phone");
    if (!item) return res.status(404).json({ message: "Not found" });

    if (item.doctor.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    const DOCTOR_NAME = `ד"ר אחמד אבו אחמד`;
    const CLINIC_NAME = `מרפאת ד"ר אחמד`;

    const safeFileName = `prescription_${item._id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);

    doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("error", (e) => {
      console.error("PDFDocument stream error:", e);
      safeEnd();
      try {
        if (!res.headersSent) res.status(500).end();
      } catch {}
    });

    res.on("error", (e) => {
      console.error("Response stream error:", e);
      safeEnd();
    });

    doc.pipe(res);
    doc.lineGap(4);

    // ✅ FONT (local -> Windows -> fallback)
    const localFont = path.join(__dirname, "..", "fonts", "Arial.ttf");
    const winArial = "C:\\Windows\\Fonts\\arial.ttf";
    const winDavid = "C:\\Windows\\Fonts\\David.ttf";
    const winArialUni = "C:\\Windows\\Fonts\\arialuni.ttf";

    const ok =
      trySetFont(doc, localFont, "LocalArial") ||
      trySetFont(doc, winArialUni, "ArialUnicodeWin") ||
      trySetFont(doc, winArial, "ArialWin") ||
      trySetFont(doc, winDavid, "DavidWin");

    if (!ok) doc.font("Helvetica");

    // ===== Layout helpers =====
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftX = doc.page.margins.left;
    const rightX = leftX + pageWidth;

    const rtlInline = (txt, opts = {}) => {
      return doc.text(String(txt ?? ""), leftX, doc.y, {
        width: pageWidth,
        align: "right",
        features: ["rtla"],
        ...opts,
      });
    };

    const centerRtl = (txt, opts = {}) => {
      return doc.text(String(txt ?? ""), leftX, doc.y, {
        width: pageWidth,
        align: "center",
        features: ["rtla"],
        ...opts,
      });
    };

    // ✅ Correct RTL label + LTR value on SAME line:
    // Right side: "תאריך:"  | immediately left of it: "31.12.2025"
    // This prevents numbers from being reversed AND keeps order correct.
    const rtlLabelThenLtrValue = (label, value, gap = 10) => {
      const y = doc.y;

      const labelStr = String(label ?? "");
      const valueStr = String(value ?? "");

      // measure widths using current font+size
      const labelW = doc.widthOfString(labelStr);
      const valueW = doc.widthOfString(valueStr);

      // label on the RIGHT
      const labelX = rightX - labelW;

      // value just LEFT of label
      const valueX = Math.max(leftX, labelX - gap - valueW);

      // label (RTL shaping)
      doc.text(labelStr, labelX, y, {
        lineBreak: false,
        features: ["rtla"],
      });

      // value (NO rtla => digits stay correct)
      doc.text(valueStr, valueX, y, {
        lineBreak: false,
      });

      doc.moveDown(1);
    };

    const drawLine = (y) => {
      doc
        .save()
        .moveTo(leftX, y)
        .lineTo(rightX, y)
        .lineWidth(1)
        .strokeColor("#E5E7EB")
        .stroke()
        .restore();
    };

    const strokeRounded = (x, y, w, h) => {
      doc.save().roundedRect(x, y, w, h, 8).lineWidth(1).strokeColor("#E5E7EB").stroke().restore();
    };

    const fillRounded = (x, y, w, h, fillColor = "#F3F4F6") => {
      doc.save().fillColor(fillColor).roundedRect(x, y, w, h, 8).fill().restore();
      doc.save().strokeColor("#E5E7EB").roundedRect(x, y, w, h, 8).stroke().restore();
    };

    // ===== Header =====
    doc.fontSize(22).fillColor("#0B3B8C");
    centerRtl(CLINIC_NAME);

    doc.moveDown(0.2);
    doc.fontSize(14).fillColor("#111827");
    centerRtl(DOCTOR_NAME);

    doc.moveDown(0.8);
    drawLine(doc.y);
    doc.moveDown(1);

    // ===== Patient Info =====
    const patientName = item.patient?.name || "";
    const patientPhone = item.patient?.phone || "";
    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();

    const dateStr = createdAt.toLocaleDateString("he-IL");
    const timeStr = createdAt.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

    doc.fontSize(12).fillColor("#111827");

    // ✅ fixed order + correct digits:
    rtlLabelThenLtrValue("תאריך:", dateStr);
    rtlLabelThenLtrValue("שעה:", timeStr);

    // name is Hebrew -> safe with rtla
    rtlInline(`שם מטופל: ${patientName}`);

    // phone is digits -> use label/value helper
    rtlLabelThenLtrValue("טלפון מטופל:", patientPhone);

    doc.moveDown(1);

    // ===== Table =====
    const tableTop = doc.y;
    const tableW = pageWidth;
    const tableX = leftX;

    const colNameW = Math.floor(tableW * 0.33);
    const colHowW = tableW - colNameW;

    const rowPadding = 12;
    const headerH = 38;

    fillRounded(tableX, tableTop, tableW, headerH, "#F3F4F6");

    // header divider
    doc
      .save()
      .moveTo(tableX + colHowW, tableTop)
      .lineTo(tableX + colHowW, tableTop + headerH)
      .strokeColor("#E5E7EB")
      .stroke()
      .restore();

    // header text
    doc.fontSize(12).fillColor("#111827");
    doc.text("כיצד משתמשים", tableX + 10, tableTop + 12, {
      width: colHowW - 20,
      align: "right",
      features: ["rtla"],
    });
    doc.text("שם מרשם", tableX + colHowW + 10, tableTop + 12, {
      width: colNameW - 20,
      align: "right",
      features: ["rtla"],
    });

    // content row
    const howText = item.notes || "";
    const nameText = item.title || "מרשם";

    // IMPORTANT:
    // - Keep features:["rtla"] for Hebrew shaping
    // - Numbers INSIDE these blocks can still be tricky, but in most prescriptions it's mostly text.
    const howOpts = { width: colHowW - 20, align: "right", lineGap: 4, features: ["rtla"] };
    const nameOpts = { width: colNameW - 20, align: "right", lineGap: 4, features: ["rtla"] };

    const howH = doc.heightOfString(howText, howOpts);
    const nameH = doc.heightOfString(nameText, nameOpts);

    const rowH = Math.max(howH, nameH) + rowPadding * 2;
    const rowY = tableTop + headerH;

    strokeRounded(tableX, rowY, tableW, rowH);

    // row divider
    doc
      .save()
      .moveTo(tableX + colHowW, rowY)
      .lineTo(tableX + colHowW, rowY + rowH)
      .strokeColor("#E5E7EB")
      .stroke()
      .restore();

    // row text
    doc.fontSize(12).fillColor("#111827");
    doc.text(howText, tableX + 10, rowY + rowPadding, howOpts);
    doc.text(nameText, tableX + colHowW + 10, rowY + rowPadding, nameOpts);

    doc.moveDown(2);

    // ===== Footer =====
    doc.fontSize(10).fillColor("#6B7280");
    centerRtl("מסמך זה הופק ממערכת המרפאה. לשאלות ובירורים ניתן ליצור קשר עם המרפאה.");

    safeEnd();
  } catch (err) {
    console.error("downloadPrescriptionPdf error:", err);
    safeEnd();

    if (!res.headersSent) {
      return res.status(500).json({ message: "Server error" });
    }
  }
};
