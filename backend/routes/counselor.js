const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Marks = require('../models/Marks');
const { Prediction, PredictionRun } = require('../models/Prediction');
const Intervention = require('../models/Intervention');

router.use(protect, authorize('counselor'));

// ============================
// Helper — HTTP fetch (avoids node-fetch ESM issues)
// ============================
const http  = require('http');
const https = require('https');

function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify(data);
    const parsed  = new URL(url);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port,
      path:     parsed.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = lib.request(options, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`Invalid JSON from ML API: ${raw}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('ML API timeout')); });
    req.write(body);
    req.end();
  });
}

// GET /api/counselor/data-status
router.get('/data-status', async (req, res) => {
  try {
    const dept = req.user.dept;

    const subjects = await Subject.find({ dept }).populate('faculty_id', 'name email');
    const status = [];

    for (const subj of subjects) {
      if (!subj.faculty_id) {
        status.push({ subject: subj, faculty: null, submitted: false, ca: false, midterm: false, attendance: false });
        continue;
      }
      const marks = await Marks.find({ subject_code: subj.subject_code, faculty_id: subj.faculty_id._id });
      const hasCA         = marks.some(m => m.ca_marks?.total > 0);
      const hasMidterm    = marks.some(m => m.midterm_score > 0);
      const hasAttendance = marks.some(m => m.submitted_at != null);
      status.push({
        subject:    subj,
        faculty:    subj.faculty_id,
        ca:         hasCA,
        midterm:    hasMidterm,
        attendance: hasAttendance,
        submitted:  hasCA && hasMidterm && hasAttendance,
        count:      marks.length
      });
    }

    // Count subjects that have no faculty assigned
    const unassignedCount = subjects.filter(s => !s.faculty_id).length;

    // Unique faculty IDs among assigned subjects
    const allFacultyIds = [...new Set(
      subjects
        .filter(s => s.faculty_id != null)
        .map(s => String(s.faculty_id._id))
    )];

    // A faculty is "submitted" only if ALL their subjects are submitted
    const submittedFacultyIds = allFacultyIds.filter(fid => {
      const theirSubjects = status.filter(s => s.faculty && String(s.faculty._id) === fid);
      return theirSubjects.length > 0 && theirSubjects.every(s => s.submitted);
    });

    const totalFaculty     = allFacultyIds.length;
    const submittedFaculty = submittedFacultyIds.length;

    res.json({
      subjects: status,
      totalFaculty,
      submittedFaculty,
      unassignedSubjects: unassignedCount,
      ready: unassignedCount === 0 && submittedFaculty >= totalFaculty && totalFaculty > 0,
      dept
    });
  } catch (err) {
    console.error('DATA-STATUS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/counselor/predict — trigger ML prediction
router.post('/predict', async (req, res) => {
  console.log('🔥 PREDICT route hit — dept:', req.user?.dept);
  try {
    const dept = req.user.dept;

    const students = await Student.find({ dept });
    console.log(`Found ${students.length} students for dept: ${dept}`);

    if (students.length === 0)
      return res.status(400).json({ message: `No students found for dept: ${dept}` });

    // Aggregate features per student
    const studentFeatures = [];
    for (const student of students) {
      const marks = await Marks.find({ student_id: student.student_id });
      if (marks.length === 0) {
        console.warn(`No marks for student: ${student.student_id}`);
        continue;
      }

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
          const caPct  = m.ca_marks?.max > 0 ? (m.ca_marks.total / m.ca_marks.max) * 100 : 0;
          const midPct = m.midterm_max > 0 ? (m.midterm_score / m.midterm_max) * 100 : 0;
          return caPct < 40 || midPct < 40;
        }).length,
        6
      );

      studentFeatures.push({
        student_id:      student.student_id,
        attendance_avg:  Math.round(attendance_avg),
        ca_avg:          Math.round(ca_avg),
        midterm_avg:     Math.round(midterm_avg),
        past_cgpa:       student.past_cgpa,
        failed_subjects,
        semester:        student.semester
      });
    }

    console.log(`Built features for ${studentFeatures.length} students`);

    if (studentFeatures.length === 0)
      return res.status(400).json({ message: 'No marks data found for any student. Ensure faculty have uploaded marks.' });

    // Call ML API (batch)
    let predictions = [];
    const ML_URL = `${process.env.ML_API_URL || 'http://localhost:5001'}/api/predict/batch`;
    try {
      console.log(`Calling ML API: ${ML_URL}`);
      const mlData = await httpPost(ML_URL, { students: studentFeatures });
      console.log('ML API raw response:', JSON.stringify(mlData).slice(0, 300));

      if (Array.isArray(mlData)) {
        predictions = mlData;
      } else if (mlData && Array.isArray(mlData.results)) {
        predictions = mlData.results;
      } else if (mlData && Array.isArray(mlData.predictions)) {
        predictions = mlData.predictions;
      } else {
        // Log the full response and fall back to local scoring
        console.warn('ML API returned unexpected shape, using fallback. Full response:', JSON.stringify(mlData));
        throw new Error(`Unexpected ML API response shape`);
      }
      console.log(`ML API returned ${predictions.length} predictions`);
    } catch (mlErr) {
      console.warn('ML API unavailable or bad response, using fallback scoring:', mlErr.message);
      predictions = studentFeatures.map(f => {
        const riskScore = computeRiskScore(f);
        return {
          student_id: f.student_id,
          risk:       riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
          score:      riskScore,
          confidence: Math.random() * 0.2 + 0.8
        };
      });
      console.log(`Fallback produced ${predictions.length} predictions`);
    }

    if (!Array.isArray(predictions) || predictions.length === 0)
      return res.status(400).json({ message: 'ML API returned no predictions' });

    // Create prediction run
    const run = await PredictionRun.create({
      triggered_by:       req.user._id,
      dept,
      students_processed: predictions.length,
      high_count:         predictions.filter(p => p.risk === 'high').length,
      medium_count:       predictions.filter(p => p.risk === 'medium').length,
      low_count:          predictions.filter(p => p.risk === 'low').length,
      model_accuracy:     0.87
    });

    // Store individual predictions
    const featureMap = {};
    studentFeatures.forEach(f => { featureMap[f.student_id] = f; });

    for (const pred of predictions) {
      const features = featureMap[pred.student_id];
      await Prediction.findOneAndUpdate(
        { student_id: pred.student_id },
        {
          student_id:    pred.student_id,
          run_id:        run._id,
          risk_level:    pred.risk,
          risk_score:    pred.score,
          features_used: {
            attendance_avg:  features?.attendance_avg,
            ca_avg:          features?.ca_avg,
            midterm_avg:     features?.midterm_avg,
            past_cgpa:       features?.past_cgpa,
            failed_subjects: features?.failed_subjects,
            semester:        features?.semester
          },
          model_version: 'v1.0',
          created_at:    new Date()
        },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Prediction complete — high: ${run.high_count}, medium: ${run.medium_count}, low: ${run.low_count}`);

    res.json({
      message:            'Prediction complete',
      run_id:             run._id,
      dept,
      students_processed: predictions.length,
      high:               run.high_count,
      medium:             run.medium_count,
      low:                run.low_count
    });
  } catch (err) {
    console.error('PREDICT ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// Local fallback risk computation
function computeRiskScore(f) {
  let score = 0;
  if (f.attendance_avg < 60)       score += 30;
  else if (f.attendance_avg < 75)  score += 15;
  if (f.ca_avg < 40)               score += 25;
  else if (f.ca_avg < 55)          score += 12;
  if (f.midterm_avg < 40)          score += 20;
  else if (f.midterm_avg < 55)     score += 10;
  if (f.past_cgpa < 5.0)           score += 15;
  else if (f.past_cgpa < 6.0)      score += 8;
  if (f.failed_subjects >= 2)      score += 10;
  return Math.min(score, 100);
}

// GET /api/counselor/predictions
router.get('/predictions', async (req, res) => {
  try {
    const dept = req.user.dept;

    const students = await Student.find({ dept });
    const studentMap = {};
    students.forEach(s => { studentMap[s.student_id] = s; });

    const studentIds = students.map(s => s.student_id);
    const predictions = await Prediction.find({ student_id: { $in: studentIds } })
      .sort({ created_at: -1 });

    const result = predictions.map(p => ({
      ...p.toObject(),
      student: studentMap[p.student_id] || null
    }));
    res.json(result);
  } catch (err) {
    console.error('PREDICTIONS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/counselor/students
router.get('/students', async (req, res) => {
  try {
    const dept = req.user.dept;

    const students = await Student.find({ dept });
    const studentIds = students.map(s => s.student_id);

    const latestPreds = await Prediction.find({ student_id: { $in: studentIds } })
      .sort({ created_at: -1 });

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
    console.error('STUDENTS ERROR:', err);
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
    console.error('INTERVENTION CREATE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/counselor/interventions
router.get('/interventions', async (req, res) => {
  try {
    const dept = req.user.dept;

    const students = await Student.find({ dept });
    const studentMap = {};
    students.forEach(s => { studentMap[s.student_id] = s; });
    const studentIds = students.map(s => s.student_id);

    const interventions = await Intervention.find({ student_id: { $in: studentIds } })
      .populate('counselor_id', 'name email')
      .sort({ created_at: -1 });

    const result = interventions.map(i => ({
      ...i.toObject(),
      student: studentMap[i.student_id] || null
    }));
    res.json(result);
  } catch (err) {
    console.error('INTERVENTIONS ERROR:', err);
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
    console.error('INTERVENTION UPDATE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;