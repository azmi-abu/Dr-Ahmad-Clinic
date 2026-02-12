const router = require('express').Router();
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');

// ✅ helper: sanitize filename for HTTP headers (prevents ERR_INVALID_CHAR)
const safeFilename = (name) => {
  if (!name) return 'file.pdf';
  // remove CR/LF + quotes + any illegal header chars
  return String(name)
    .replace(/[\r\n]/g, '')
    .replace(/["]/g, '')
    .replace(/[<>:|?*]/g, '_')
    .trim() || 'file.pdf';
};

// ✅ GET /api/patients  (doctor only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patients = await User.find({ role: 'patient' })
      .select('name phone profileImage consentForms');

    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/patients  (add patient manually + optional profile image)
router.post('/', auth, async (req, res) => {
  const { phone, name, imageBase64 } = req.body;

  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (!phone || !name) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  const exists = await User.findOne({ phone });
  if (exists) {
    return res.status(400).json({ message: 'Patient already exists' });
  }

  try {
    const newPatient = await User.create({
      phone,
      name,
      role: 'patient',
      profileImage: imageBase64
        ? { data: imageBase64, uploadedAt: new Date() }
        : undefined,
    });

    res.status(201).json(newPatient);
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PUT /api/patients/:id/forms/:formKey  (upload a consent form)
router.put('/:id/forms/:formKey', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id, formKey } = req.params;
    const { fileBase64, filename, mimeType } = req.body;

    const allowed = ['botox', 'hyaluronic', 'sculptra', 'salmon'];
    if (!allowed.includes(formKey)) {
      return res.status(400).json({ message: 'Invalid form key' });
    }

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ message: 'fileBase64 is required' });
    }

    const patient = await User.findById(id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (!patient.consentForms) patient.consentForms = {};

    patient.consentForms[formKey] = {
      data: fileBase64,
      filename: safeFilename(filename || `${formKey}.pdf`),
      mimeType: mimeType || 'application/pdf',
      uploadedAt: new Date(),
    };

    await patient.save();

    // ✅ return updated consentForms so frontend can update instantly
    res.json({ message: 'Form uploaded', formKey, consentForms: patient.consentForms });
  } catch (err) {
    console.error('Upload form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/patients/:id/forms/:formKey  (download a consent form)
router.get('/:id/forms/:formKey', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id, formKey } = req.params;

    const allowed = ['botox', 'hyaluronic', 'sculptra', 'salmon'];
    if (!allowed.includes(formKey)) {
      return res.status(400).json({ message: 'Invalid form key' });
    }

    const patient = await User.findById(id).select('consentForms');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const form = patient.consentForms?.[formKey];
    if (!form?.data) {
      return res.status(404).json({ message: 'Form not uploaded' });
    }

    const base64Part = form.data.includes(',')
      ? form.data.split(',')[1]
      : form.data;

    const buffer = Buffer.from(base64Part, 'base64');

    const filename = safeFilename(form.filename || `${formKey}.pdf`);

    res.setHeader('Content-Type', form.mimeType || 'application/pdf');
    // ✅ ASCII-safe header; prevents ERR_INVALID_CHAR
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  } catch (err) {
    console.error('Download form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
