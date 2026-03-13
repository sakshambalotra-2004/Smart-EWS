const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');
const bcrypt = require('bcryptjs');

const upload = multer({ dest: '/tmp/' });

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

// POST /api/admin/uploadrecords — upload student master CSV
router.post('/uploadrecords', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let created = 0, updated = 0;
        for (const row of results) {
          const studentData = {
            student_id:        row.student_id?.trim(),
            name:              row.name?.trim(),
            email:             row.email?.trim().toLowerCase(),
            parent_email:      row.parent_email?.trim().toLowerCase(),
            dept:              row.dept?.trim(),
            semester:          parseInt(row.semester),
            past_cgpa:         parseFloat(row.past_cgpa),
            enrolled_subjects: row.enrolled_subjects
              ? row.enrolled_subjects.split(';').map(s => s.trim())
              : [],
          };

          if (!studentData.student_id) continue;

          const existing = await Student.findOne({ student_id: studentData.student_id });
          if (existing) {
            await Student.updateOne({ student_id: studentData.student_id }, studentData);
            updated++;
          } else {
            await Student.create(studentData);
            // Also create user account for student
            const existingUser = await User.findOne({ email: studentData.email });
            if (!existingUser) {
              const defaultPassword = await bcrypt.hash('Student@123', 12);
              await User.create({
                name:       studentData.name,
                email:      studentData.email,
                password:   defaultPassword,
                role:       'student',
                dept:       studentData.dept,
                student_id: studentData.student_id
              });
            }
            created++;
          }
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `Processed ${results.length} records`, created, updated });
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ student_id: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/users — create user manually
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, dept, student_id } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = new User({ name, email, password, role, dept, student_id });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/subjects — create subject
router.post('/subjects', async (req, res) => {
  try {
    const { subject_code, subject_name, dept, semester, semester_label } = req.body;
    const existing = await Subject.findOne({ subject_code });
    if (existing) return res.status(400).json({ message: 'Subject code already exists' });

    const subject = await Subject.create({ subject_code, subject_name, dept, semester, semester_label });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/subjects/:id/assign — assign faculty to subject
router.put('/subjects/:id/assign', async (req, res) => {
  try {
    const { faculty_id } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { faculty_id },
      { new: true }
    ).populate('faculty_id', 'name email');

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const { Prediction } = require('../models/Prediction');
    const totalStudents = await Student.countDocuments();
    const predictions = await Prediction.find().sort({ created_at: -1 }).limit(100);

    const high   = predictions.filter(p => p.risk_level === 'high').length;
    const medium = predictions.filter(p => p.risk_level === 'medium').length;
    const low    = predictions.filter(p => p.risk_level === 'low').length;

    const deptBreakdown = await Student.aggregate([
      { $group: { _id: '$dept', count: { $sum: 1 } } }
    ]);

    res.json({ totalStudents, riskBreakdown: { high, medium, low }, deptBreakdown, totalPredictions: predictions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PerceptronModel = require('../../ml-model/models/PerceptronModel');

// POST /api/admin/upload-model — upload perceptron_model.csv
router.post('/upload-model', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const lines = fs.readFileSync(req.file.path, 'utf8').trim().split('\n');
    fs.unlinkSync(req.file.path);

    // Parse CSV: rows = classes, cols = [features..., bias]
    const header = lines[0].split(',');                         // ca_total,midterm_score,attendance_pct,past_cgpa,bias
    const featureNames = header.slice(0, -1);                   // drop 'bias'
    const rows = lines.slice(1).map(l => l.split(',').map(Number));

    // Build W [features x classes] and b [classes]
    const numFeatures = featureNames.length;
    const numClasses  = rows.length;

    const W = Array.from({ length: numFeatures }, (_, f) =>
      rows.map(row => row[f])
    );
    const b = rows.map(row => row[row.length - 1]);

    // Deactivate previous active model
    await PerceptronModel.updateMany({ is_active: true }, { is_active: false });

    const version = `v${Date.now()}`;
    const saved = await PerceptronModel.create({
      version,
      features: featureNames,
      weights:  W,
      biases:   b,
      classes:  ['high', 'medium', 'low'],
      accuracy: parseFloat(req.body.accuracy) || null,
      is_active: true
    });

    res.json({ message: 'Model uploaded and activated', version: saved.version, id: saved._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;