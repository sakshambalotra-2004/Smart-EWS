const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Marks = require('../models/Marks');

const SEMESTER = 'Spring 2025';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Marks.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // NOTE: Pass plain text passwords — User model hashes them via pre('save')
  // NEVER pre-hash here — that causes double hashing and login will always fail

  await User.create({ name: 'Admin User', email: 'admin@university.edu', password: 'Admin@123', role: 'admin', dept: 'CS' });
  await User.create({ name: 'Dr. Sarah Mitchell', email: 'counselor@university.edu', password: 'Counselor@123', role: 'counselor', dept: 'CS' });

  const faculty = await Promise.all([
    User.create({ name: 'Dr. Roberts',  email: 'roberts@university.edu', password: 'Faculty@123', role: 'faculty', dept: 'CS', assigned_subjects: ['CS301','CS302'] }),
    User.create({ name: 'Prof. Nguyen', email: 'nguyen@university.edu',  password: 'Faculty@123', role: 'faculty', dept: 'CS', assigned_subjects: ['CS303'] }),
    User.create({ name: 'Dr. Patel',    email: 'patel@university.edu',   password: 'Faculty@123', role: 'faculty', dept: 'CS', assigned_subjects: ['CS304'] }),
    User.create({ name: 'Prof. Chen',   email: 'chen@university.edu',    password: 'Faculty@123', role: 'faculty', dept: 'EE', assigned_subjects: ['EE201'] }),
  ]);

  await Promise.all([
    Subject.create({ subject_code: 'CS301', subject_name: 'Data Structures',   dept: 'CS', semester: 3, faculty_id: faculty[0]._id, semester_label: SEMESTER }),
    Subject.create({ subject_code: 'CS302', subject_name: 'Database Systems',  dept: 'CS', semester: 3, faculty_id: faculty[0]._id, semester_label: SEMESTER }),
    Subject.create({ subject_code: 'CS303', subject_name: 'Computer Networks', dept: 'CS', semester: 3, faculty_id: faculty[1]._id, semester_label: SEMESTER }),
    Subject.create({ subject_code: 'CS304', subject_name: 'Operating Systems', dept: 'CS', semester: 3, faculty_id: faculty[2]._id, semester_label: SEMESTER }),
  ]);

  const studentsData = [
    { student_id: 'CS2201', name: 'Aisha Rahman',    email: 'aisha@university.edu',  dept: 'CS', semester: 3, past_cgpa: 1.8 },
    { student_id: 'CS2202', name: 'James Wilson',    email: 'james@university.edu',  dept: 'CS', semester: 3, past_cgpa: 3.5 },
    { student_id: 'CS2203', name: 'Maria Garcia',    email: 'maria@university.edu',  dept: 'CS', semester: 3, past_cgpa: 2.1 },
    { student_id: 'CS2204', name: 'Ahmed Hassan',    email: 'ahmed@university.edu',  dept: 'CS', semester: 3, past_cgpa: 1.5 },
    { student_id: 'CS2205', name: 'Sophie Turner',   email: 'sophie@university.edu', dept: 'CS', semester: 3, past_cgpa: 3.8 },
    { student_id: 'CS2206', name: 'Raj Patel',       email: 'raj@university.edu',    dept: 'CS', semester: 3, past_cgpa: 2.7 },
    { student_id: 'CS2207', name: 'Fatima Al-Zahra', email: 'fatima@university.edu', dept: 'CS', semester: 3, past_cgpa: 1.9 },
    { student_id: 'CS2208', name: 'David Kim',       email: 'david@university.edu',  dept: 'CS', semester: 3, past_cgpa: 3.2 },
    { student_id: 'CS2209', name: 'Nina Okafor',     email: 'nina@university.edu',   dept: 'CS', semester: 3, past_cgpa: 2.4 },
    { student_id: 'CS2210', name: 'Luis Herrera',    email: 'luis@university.edu',   dept: 'CS', semester: 3, past_cgpa: 1.6 },
  ];

  await Student.insertMany(studentsData.map(s => ({ ...s, enrolled_subjects: ['CS301','CS302','CS303','CS304'], semester_label: SEMESTER })));

  for (const s of studentsData) {
    await User.create({ name: s.name, email: s.email, password: 'Student@123', role: 'student', dept: s.dept, student_id: s.student_id });
  }

  const marksData = [
    { student_id: 'CS2201', subject_code: 'CS301', ca_marks: { ca1: 8,  ca2: 10, ca3: 9,  total: 27, max: 75 }, midterm_score: 18, midterm_max: 50, attendance_pct: 62 },
    { student_id: 'CS2201', subject_code: 'CS302', ca_marks: { ca1: 12, ca2: 10, ca3: 11, total: 33, max: 75 }, midterm_score: 20, midterm_max: 50, attendance_pct: 58 },
    { student_id: 'CS2201', subject_code: 'CS303', ca_marks: { ca1: 9,  ca2: 11, ca3: 10, total: 30, max: 75 }, midterm_score: 15, midterm_max: 50, attendance_pct: 65 },
    { student_id: 'CS2201', subject_code: 'CS304', ca_marks: { ca1: 14, ca2: 12, ca3: 13, total: 39, max: 75 }, midterm_score: 22, midterm_max: 50, attendance_pct: 60 },
    { student_id: 'CS2202', subject_code: 'CS301', ca_marks: { ca1: 22, ca2: 24, ca3: 23, total: 69, max: 75 }, midterm_score: 44, midterm_max: 50, attendance_pct: 95 },
    { student_id: 'CS2202', subject_code: 'CS302', ca_marks: { ca1: 21, ca2: 23, ca3: 22, total: 66, max: 75 }, midterm_score: 43, midterm_max: 50, attendance_pct: 92 },
    { student_id: 'CS2202', subject_code: 'CS303', ca_marks: { ca1: 23, ca2: 24, ca3: 22, total: 69, max: 75 }, midterm_score: 45, midterm_max: 50, attendance_pct: 96 },
    { student_id: 'CS2202', subject_code: 'CS304', ca_marks: { ca1: 20, ca2: 22, ca3: 21, total: 63, max: 75 }, midterm_score: 42, midterm_max: 50, attendance_pct: 90 },
    { student_id: 'CS2203', subject_code: 'CS301', ca_marks: { ca1: 15, ca2: 17, ca3: 16, total: 48, max: 75 }, midterm_score: 28, midterm_max: 50, attendance_pct: 72 },
    { student_id: 'CS2203', subject_code: 'CS302', ca_marks: { ca1: 16, ca2: 15, ca3: 14, total: 45, max: 75 }, midterm_score: 25, midterm_max: 50, attendance_pct: 68 },
    { student_id: 'CS2203', subject_code: 'CS303', ca_marks: { ca1: 14, ca2: 16, ca3: 15, total: 45, max: 75 }, midterm_score: 27, midterm_max: 50, attendance_pct: 74 },
    { student_id: 'CS2203', subject_code: 'CS304', ca_marks: { ca1: 17, ca2: 18, ca3: 17, total: 52, max: 75 }, midterm_score: 30, midterm_max: 50, attendance_pct: 71 },
    { student_id: 'CS2204', subject_code: 'CS301', ca_marks: { ca1: 7,  ca2: 8,  ca3: 6,  total: 21, max: 75 }, midterm_score: 14, midterm_max: 50, attendance_pct: 55 },
    { student_id: 'CS2204', subject_code: 'CS302', ca_marks: { ca1: 9,  ca2: 8,  ca3: 10, total: 27, max: 75 }, midterm_score: 16, midterm_max: 50, attendance_pct: 50 },
    { student_id: 'CS2204', subject_code: 'CS303', ca_marks: { ca1: 6,  ca2: 9,  ca3: 8,  total: 23, max: 75 }, midterm_score: 13, midterm_max: 50, attendance_pct: 57 },
    { student_id: 'CS2204', subject_code: 'CS304', ca_marks: { ca1: 10, ca2: 11, ca3: 9,  total: 30, max: 75 }, midterm_score: 17, midterm_max: 50, attendance_pct: 52 },
    { student_id: 'CS2205', subject_code: 'CS301', ca_marks: { ca1: 24, ca2: 25, ca3: 24, total: 73, max: 75 }, midterm_score: 48, midterm_max: 50, attendance_pct: 98 },
    { student_id: 'CS2205', subject_code: 'CS302', ca_marks: { ca1: 23, ca2: 24, ca3: 24, total: 71, max: 75 }, midterm_score: 47, midterm_max: 50, attendance_pct: 97 },
    { student_id: 'CS2205', subject_code: 'CS303', ca_marks: { ca1: 24, ca2: 23, ca3: 25, total: 72, max: 75 }, midterm_score: 49, midterm_max: 50, attendance_pct: 99 },
    { student_id: 'CS2205', subject_code: 'CS304', ca_marks: { ca1: 22, ca2: 24, ca3: 23, total: 69, max: 75 }, midterm_score: 46, midterm_max: 50, attendance_pct: 96 },
  ];

  for (const m of marksData) {
    await Marks.create({ ...m, faculty_id: faculty[0]._id, semester_label: SEMESTER, submitted_at: new Date() });
  }

  const remaining = [
    { id: 'CS2206', ca: [16,17,16,48], mid: 29, att: 74 },
    { id: 'CS2207', ca: [10,11,10,31], mid: 19, att: 63 },
    { id: 'CS2208', ca: [20,21,20,61], mid: 40, att: 88 },
    { id: 'CS2209', ca: [15,14,15,44], mid: 26, att: 70 },
    { id: 'CS2210', ca: [8, 9, 8, 25], mid: 15, att: 56 },
  ];
  for (const r of remaining) {
    for (const subj of ['CS301','CS302','CS303','CS304']) {
      await Marks.create({
        student_id: r.id, subject_code: subj, faculty_id: faculty[0]._id, semester_label: SEMESTER,
        ca_marks: { ca1: r.ca[0], ca2: r.ca[1], ca3: r.ca[2], total: r.ca[3], max: 75 },
        midterm_score: r.mid, midterm_max: 50, attendance_pct: r.att, submitted_at: new Date()
      });
    }
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:     admin@university.edu      / Admin@123');
  console.log('  Counselor: counselor@university.edu  / Counselor@123');
  console.log('  Faculty:   roberts@university.edu    / Faculty@123');
  console.log('  Student:   aisha@university.edu      / Student@123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });