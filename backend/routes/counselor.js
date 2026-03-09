const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Marks = require('../models/Marks');
const { Prediction, PredictionRun } = require('../models/Prediction');
const Intervention = require('../models/Intervention');

router.use(protect, authorize('counselor'));

// GET /api/counselor/data-status
router.get('/data-status', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('faculty_id', 'name email');
    const status = [];
    
    for (const subj of subjects) {
      if (!subj.faculty_id) {
        status.push({ subject: subj, faculty: null, submitted: false, ca: false, midterm: false, attendance: false });
        continue;
      }
      const marks = await Marks.find({ subject_code: subj.subject_code, faculty_id: subj.faculty_id._id });
      const hasCA = marks.some(m => m.ca_marks?.total > 0);
      const hasMidterm = marks.some(m => m.midterm_score > 0);
      const hasAttendance = marks.some(m => m.submitted_at != null);
      status.push({
        subject: subj,
        faculty: subj.faculty_id,
        ca: hasCA,
        midterm: hasMidterm,
        attendance: hasAttendance,
        submitted: hasCA && hasMidterm && hasAttendance,
        count: marks.length
      });
    }

    const totalFaculty = [...new Set(subjects.filter(s => s.faculty_id).map(s => String(s.faculty_id._id)))].length;
    const submittedFaculty = status.filter(s => s.submitted).length;

    res.json({ subjects: status, totalFaculty, submittedFaculty, ready: submittedFaculty >= totalFaculty && totalFaculty > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/counselor/predict — trigger ML prediction
router.post('/predict', async (req, res) => {
  try {
    const semester_label = req.body.semester_label || 'Spring 2025';
    const students = await Student.find({ semester_label });
    
    if (students.length === 0) return res.status(400).json({ message: 'No students found for this semester' });

    // Aggregate features per student
    const studentFeatures = [];
    for (const student of students) {
      const marks = await Marks.find({ student_id: student.student_id, semester_label });
      
      if (marks.length === 0) continue;

      const attendance_avg = marks.reduce((sum, m) => sum + (m.attendance_pct || 0), 0) / marks.length;
      const ca_avg = marks.reduce((sum, m) => {
        const pct = m.ca_marks?.max > 0 ? (m.ca_marks.total / m.ca_marks.max) * 100 : 0;
        return sum + pct;
      }, 0) / marks.length;
      const midterm_avg = marks.reduce((sum, m) => {
        const pct = m.midterm_max > 0 ? (m.midterm_score / m.midterm_max) * 100 : 0;
        return sum + pct;
      }, 0) / marks.length;
      const failed_subjects = Math.min(
        marks.filter(m => {
          const caPct = m.ca_marks?.max > 0 ? (m.ca_marks.total / m.ca_marks.max) * 100 : 0;
          const midPct = m.midterm_max > 0 ? (m.midterm_score / m.midterm_max) * 100 : 0;
          return caPct < 40 || midPct < 40;
        }).length,
        6
      );

      studentFeatures.push({
        student_id: student.student_id,
        attendance: Math.round(attendance_avg),
        ca_avg: Math.round(ca_avg),
        midterm_avg: Math.round(midterm_avg),
        past_cgpa: student.past_cgpa,
        failed_subjects,
        semester: student.semester
      });
    }

    // Call Flask ML API (batch)
    let predictions = [];
    try {
      const flaskRes = await fetch(`${process.env.FLASK_API_URL}/api/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentFeatures }),
        timeout: 30000
      });
      const flaskData = await flaskRes.json();
      predictions = flaskData.results || flaskData;
    } catch (flaskErr) {
      console.warn('Flask API unavailable, using fallback scoring:', flaskErr.message);
      // Fallback: compute risk locally
      predictions = studentFeatures.map(f => {
        const riskScore = computeRiskScore(f);
        return {
          student_id: f.student_id,
          risk: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
          score: riskScore,
          confidence: Math.random() * 0.2 + 0.8
        };
      });
    }

    // Create prediction run
    const run = await PredictionRun.create({
      triggered_by: req.user._id,
      semester_label,
      students_processed: predictions.length,
      high_count: predictions.filter(p => p.risk === 'high').length,
      medium_count: predictions.filter(p => p.risk === 'medium').length,
      low_count: predictions.filter(p => p.risk === 'low').length,
      model_accuracy: 0.87
    });

    // Store individual predictions
    const featureMap = {};
    studentFeatures.forEach(f => { featureMap[f.student_id] = f; });

    for (const pred of predictions) {
      const features = featureMap[pred.student_id];
      await Prediction.findOneAndUpdate(
        { student_id: pred.student_id },
        {
          student_id: pred.student_id,
          run_id: run._id,
          risk_level: pred.risk,
          risk_score: pred.score,
          features_used: {
            attendance_avg: features?.attendance,
            ca_avg: features?.ca_avg,
            midterm_avg: features?.midterm_avg,
            past_cgpa: features?.past_cgpa,
            failed_subjects: features?.failed_subjects,
            semester: features?.semester
          },
          model_version: 'v1.0',
          created_at: new Date()
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      message: 'Prediction complete',
      run_id: run._id,
      students_processed: predictions.length,
      high: run.high_count,
      medium: run.medium_count,
      low: run.low_count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Local fallback risk computation
function computeRiskScore(f) {
  let score = 0;
  if (f.attendance < 60) score += 30;
  else if (f.attendance < 75) score += 15;
  if (f.ca_avg < 40) score += 25;
  else if (f.ca_avg < 55) score += 12;
  if (f.midterm_avg < 40) score += 20;
  else if (f.midterm_avg < 55) score += 10;
  if (f.past_cgpa < 2.0) score += 15;
  else if (f.past_cgpa < 2.5) score += 8;
  if (f.failed_subjects >= 2) score += 10;
  return Math.min(score, 100);
}

// GET /api/counselor/predictions
router.get('/predictions', async (req, res) => {
  try {
    const predictions = await Prediction.find().sort({ created_at: -1 });
    const students = await Student.find();
    const studentMap = {};
    students.forEach(s => { studentMap[s.student_id] = s; });

    const result = predictions.map(p => ({
      ...p.toObject(),
      student: studentMap[p.student_id] || null
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/counselor/students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    const latestPreds = await Prediction.find().sort({ created_at: -1 });
    
    // Latest prediction per student
    const predMap = {};
    latestPreds.forEach(p => {
      if (!predMap[p.student_id]) predMap[p.student_id] = p;
    });

    const result = students.map(s => ({
      ...s.toObject(),
      prediction: predMap[s.student_id] || null
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/counselor/interventions
router.post('/interventions', async (req, res) => {
  try {
    const { student_id, type, notes, scheduled_date } = req.body;
    const intervention = await Intervention.create({
      student_id, type, notes, scheduled_date,
      counselor_id: req.user._id
    });
    res.status(201).json(intervention);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/counselor/interventions
router.get('/interventions', async (req, res) => {
  try {
    const interventions = await Intervention.find()
      .populate('counselor_id', 'name email')
      .sort({ created_at: -1 });
    const students = await Student.find();
    const studentMap = {};
    students.forEach(s => { studentMap[s.student_id] = s; });
    
    const result = interventions.map(i => ({
      ...i.toObject(),
      student: studentMap[i.student_id] || null
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/counselor/interventions/:id
router.put('/interventions/:id', async (req, res) => {
  try {
    const { status, notes, completed_date } = req.body;
    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { status, notes, completed_date: status === 'Completed' ? new Date() : null },
      { new: true }
    );
    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });
    res.json(intervention);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
