const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Marks = require('../models/Marks');
const Student = require('../models/Student');

const upload = multer({ dest: '/tmp/' });

router.use(protect, authorize('faculty'));

// GET /api/faculty/subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ faculty_id: req.user._id });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/uploadmarks
// Expects: subject_code, type (ca|midterm|attendance), file (CSV)
router.post('/uploadmarks', upload.single('file'), async (req, res) => {
  try {
    const { subject_code, type, semester_label = 'Spring 2025' } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    if (!subject_code || !type) return res.status(400).json({ message: 'subject_code and type required' });

    // Verify faculty owns this subject
    const subject = await Subject.findOne({ subject_code, faculty_id: req.user._id });
    if (!subject) return res.status(403).json({ message: 'Not authorized for this subject' });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', async () => {
        let processed = 0;
        for (const row of results) {
          const sid = row.student_id?.trim();
          if (!sid) continue;

          let updateData = {};
          if (type === 'ca') {
            const ca1 = parseFloat(row.ca1 || 0);
            const ca2 = parseFloat(row.ca2 || 0);
            const ca3 = parseFloat(row.ca3 || 0);
            const max = parseFloat(row.max || 75);
            updateData = {
              ca_marks: { ca1, ca2, ca3, total: ca1 + ca2 + ca3, max },
              submitted_at: new Date()
            };
          } else if (type === 'midterm') {
            updateData = {
              midterm_score: parseFloat(row.midterm_score || 0),
              midterm_max: parseFloat(row.midterm_max || 50),
              submitted_at: new Date()
            };
          } else if (type === 'attendance') {
            updateData = {
              attendance_pct: parseFloat(row.attendance_pct || 0),
              submitted_at: new Date()
            };
          }

          await Marks.findOneAndUpdate(
            { student_id: sid, subject_code, semester_label },
            { ...updateData, faculty_id: req.user._id, subject_code, student_id: sid, semester_label },
            { upsert: true, new: true }
          );
          processed++;
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `Uploaded ${type} for ${processed} students`, subject_code, type });
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/submissionstatus
router.get('/submissionstatus', async (req, res) => {
  try {
    const subjects = await Subject.find({ faculty_id: req.user._id });
    const status = [];
    
    for (const subj of subjects) {
      const marks = await Marks.find({ subject_code: subj.subject_code, faculty_id: req.user._id });
      const hasCA = marks.some(m => m.ca_marks?.total > 0);
      const hasMidterm = marks.some(m => m.midterm_score > 0);
      const hasAttendance = marks.some(m => m.attendance_pct >= 0 && m.submitted_at);
      status.push({
        subject_code: subj.subject_code,
        subject_name: subj.subject_name,
        ca_submitted: hasCA,
        midterm_submitted: hasMidterm,
        attendance_submitted: hasAttendance,
        students_count: marks.length
      });
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/behavior — submit behavior ratings
router.post('/behavior', async (req, res) => {
  try {
    const { ratings, subject_code } = req.body; // ratings: [{student_id, participation, attention, discipline}]
    // For now store as part of marks or a separate collection
    // Using marks collection — add behavioral data
    let updated = 0;
    for (const rating of ratings) {
      await Marks.findOneAndUpdate(
        { student_id: rating.student_id, subject_code, faculty_id: req.user._id },
        { behavior: { participation: rating.participation, attention: rating.attention, discipline: rating.discipline } },
        { upsert: false }
      );
      updated++;
    }
    res.json({ message: `Updated behavior for ${updated} students` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/students — get students for a subject
router.get('/students/:subject_code', async (req, res) => {
  try {
    const { subject_code } = req.params;
    const subject = await Subject.findOne({ subject_code, faculty_id: req.user._id });
    if (!subject) return res.status(403).json({ message: 'Not authorized' });

    const students = await Student.find({ enrolled_subjects: subject_code });
    const marks = await Marks.find({ subject_code, faculty_id: req.user._id });
    
    const result = students.map(s => ({
      ...s.toObject(),
      marks: marks.find(m => m.student_id === s.student_id) || null
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
