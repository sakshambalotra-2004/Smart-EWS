const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');

// GET /api/subjects — admin gets all subjects
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const subjects = await Subject.find().populate('faculty_id', 'name email dept');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/subjects — admin creates subject
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { subject_code, subject_name, dept, semester, semester_label } = req.body;
    const subject = await Subject.create({ subject_code, subject_name, dept, semester, semester_label });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/subjects/:id/assign — admin assigns faculty
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
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

// GET /api/subjects/mine — faculty gets their subjects
router.get('/mine', protect, authorize('faculty'), async (req, res) => {
  try {
    const subjects = await Subject.find({ faculty_id: req.user._id });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
