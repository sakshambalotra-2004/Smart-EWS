const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const { Prediction } = require('../models/Prediction');
const Intervention = require('../models/Intervention');

router.use(protect, authorize('student'));

// GET /api/student/me
router.get('/me', async (req, res) => {
  try {
    const student = await Student.findOne({ student_id: req.user.student_id });
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const prediction = await Prediction.findOne({ student_id: student.student_id }).sort({ created_at: -1 });
    
    // Generate AI recommendations based on risk features
    const recommendations = generateRecommendations(prediction);

    res.json({ student, prediction, recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/marks
router.get('/marks', async (req, res) => {
  try {
    const marks = await Marks.find({ student_id: req.user.student_id });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/interventions
router.get('/interventions', async (req, res) => {
  try {
    const interventions = await Intervention.find({ student_id: req.user.student_id })
      .populate('counselor_id', 'name email')
      .sort({ created_at: -1 });
    res.json(interventions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function generateRecommendations(prediction) {
  if (!prediction) return ['Keep attending classes regularly.', 'Submit all assignments on time.', 'Visit your academic advisor if needed.'];
  
  const f = prediction.features_used;
  const recs = [];
  
  if (f.attendance_avg < 75) recs.push(`Your attendance is ${f.attendance_avg}% — aim for at least 80% to avoid academic penalties.`);
  else recs.push('Great attendance! Keep it consistent through the semester.');
  
  if (f.ca_avg < 50) recs.push('Your continuous assessment scores need improvement. Seek help from your faculty or tutoring center.');
  else recs.push('Your CA scores are decent. Push for excellence in the final exams.');
  
  if (f.midterm_avg < 50) recs.push('Consider joining a study group or requesting extra sessions with your professor to improve your midterm performance.');
  else recs.push('Solid midterm performance! Maintain this momentum.');
  
  if (f.past_cgpa < 2.5) recs.push('Your previous CGPA is a concern. Meet with your academic counselor to create an improvement plan.');
  
  if (f.failed_subjects > 0) recs.push(`You have ${f.failed_subjects} subject(s) at risk of failure. Prioritize these immediately.`);
  
  return recs.slice(0, 3);
}

module.exports = router;
