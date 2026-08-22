/**
 * Seed script — creates demo admin, teacher, students, departments,
 * classes, courses, and sample exams with questions.
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Class = require('./models/Class');
const Course = require('./models/Course');
const Exam = require('./models/Exam');
const Question = require('./models/Question');
const Result = require('./models/Result');
const Notification = require('./models/Notification');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clean slate
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), Class.deleteMany({}),
    Course.deleteMany({}), Exam.deleteMany({}), Question.deleteMany({}),
    Result.deleteMany({}), Notification.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // ── Departments ──────────────────────────────────────────────────────────
  const csDept = await Department.create({ name: 'Computer Science', code: 'CS' });
  const mathDept = await Department.create({ name: 'Mathematics', code: 'MATH' });
  console.log('✅ Departments created');

  // ── Users (credentials read from .env — never hardcoded) ─────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    || 'admin@exam.com';
  const adminPass     = process.env.SEED_ADMIN_PASSWORD;
  const teacherEmail  = process.env.SEED_TEACHER_EMAIL  || 'teacher@exam.com';
  const teacherPass   = process.env.SEED_TEACHER_PASSWORD;
  const teacher2Email = process.env.SEED_TEACHER2_EMAIL || 'teacher2@exam.com';
  const studentEmail  = process.env.SEED_STUDENT_EMAIL  || 'student@exam.com';
  const studentPass   = process.env.SEED_STUDENT_PASSWORD;
  const student2Email = process.env.SEED_STUDENT2_EMAIL || 'student2@exam.com';

  if (!adminPass || !teacherPass || !studentPass) {
    console.error('❌  Missing required seed passwords in .env');
    console.error('    Set SEED_ADMIN_PASSWORD, SEED_TEACHER_PASSWORD, SEED_STUDENT_PASSWORD');
    process.exit(1);
  }

  const admin = await User.create({
    name: 'Admin User', email: adminEmail, password: adminPass,
    role: 'admin', department: csDept._id,
  });

  const teacher1 = await User.create({
    name: 'Dr. Sarah Johnson', email: teacherEmail, password: teacherPass,
    role: 'teacher', department: csDept._id, employeeId: 'EMP001',
  });

  const teacher2 = await User.create({
    name: 'Prof. Mark Williams', email: teacher2Email, password: teacherPass,
    role: 'teacher', department: mathDept._id, employeeId: 'EMP002',
  });

  const student1 = await User.create({
    name: 'John Student', email: studentEmail, password: studentPass,
    role: 'student', department: csDept._id, studentId: 'STU001',
  });

  const student2 = await User.create({
    name: 'Jane Smith', email: student2Email, password: studentPass,
    role: 'student', department: csDept._id, studentId: 'STU002',
  });
  console.log('✅ Users created');

  // ── Classes ──────────────────────────────────────────────────────────────
  const class1 = await Class.create({
    name: 'CS Year 2 - Section A', code: 'CS2A',
    department: csDept._id, academicYear: '2025-2026', semester: 'Fall',
    students: [student1._id, student2._id],
    teachers: [teacher1._id],
  });

  const class2 = await Class.create({
    name: 'Math Year 1 - Section B', code: 'MATH1B',
    department: mathDept._id, academicYear: '2025-2026', semester: 'Fall',
    students: [student1._id],
    teachers: [teacher2._id],
  });

  // Update students with enrolled classes
  await User.findByIdAndUpdate(student1._id, { enrolledClasses: [class1._id, class2._id] });
  await User.findByIdAndUpdate(student2._id, { enrolledClasses: [class1._id] });
  await User.findByIdAndUpdate(teacher1._id, { assignedClasses: [class1._id] });
  await User.findByIdAndUpdate(teacher2._id, { assignedClasses: [class2._id] });
  console.log('✅ Classes created');

  // ── Courses ──────────────────────────────────────────────────────────────
  const webCourse = await Course.create({
    name: 'Web Development', code: 'CS301',
    description: 'Full-stack web development fundamentals',
    department: csDept._id, teachers: [teacher1._id], classes: [class1._id],
  });

  const mathCourse = await Course.create({
    name: 'Calculus I', code: 'MATH101',
    description: 'Introduction to differential and integral calculus',
    department: mathDept._id, teachers: [teacher2._id], classes: [class2._id],
  });

  await User.findByIdAndUpdate(teacher1._id, { assignedCourses: [webCourse._id] });
  await User.findByIdAndUpdate(teacher2._id, { assignedCourses: [mathCourse._id] });
  await User.findByIdAndUpdate(student1._id, { enrolledCourses: [webCourse._id, mathCourse._id] });
  await User.findByIdAndUpdate(student2._id, { enrolledCourses: [webCourse._id] });
  console.log('✅ Courses created');

  // ── Exam 1: JavaScript Fundamentals ──────────────────────────────────────
  const exam1 = await Exam.create({
    title: 'JavaScript Fundamentals', subject: 'Web Development',
    description: 'Test your knowledge of core JavaScript concepts.',
    course: webCourse._id, assignedClasses: [class1._id], department: csDept._id,
    duration: 30, passingMarks: 60, totalMarks: 0, maxAttempts: 2,
    isPublished: true, status: 'active', shuffleQuestions: true,
    instructions: '1. Read each question carefully.\n2. Each question carries marks as shown.\n3. Submit before the timer expires.',
    allowReview: true, showResultImmediately: true,
    gradingScale: [
      { grade: 'A+', minPercent: 90, maxPercent: 100 },
      { grade: 'A', minPercent: 80, maxPercent: 89 },
      { grade: 'B', minPercent: 70, maxPercent: 79 },
      { grade: 'C', minPercent: 60, maxPercent: 69 },
      { grade: 'D', minPercent: 50, maxPercent: 59 },
      { grade: 'F', minPercent: 0, maxPercent: 49 },
    ],
    createdBy: teacher1._id,
  });

  const jsQuestions = [
    { questionText: 'Which of the following is NOT a JavaScript data type?', questionType: 'single', marks: 10, difficultyLevel: 'easy', options: [{ text: 'String', isCorrect: false }, { text: 'Boolean', isCorrect: false }, { text: 'Float', isCorrect: true }, { text: 'Symbol', isCorrect: false }], explanation: 'JavaScript has String, Number, Boolean, Undefined, Null, Object, Symbol, BigInt. "Float" is not a separate type.' },
    { questionText: 'What does === operator check in JavaScript?', questionType: 'single', marks: 10, difficultyLevel: 'easy', options: [{ text: 'Only value equality', isCorrect: false }, { text: 'Only type equality', isCorrect: false }, { text: 'Both value and type equality', isCorrect: true }, { text: 'Assignment', isCorrect: false }], explanation: '=== is the strict equality operator.' },
    { questionText: 'Which keyword declares a block-scoped variable that can be reassigned?', questionType: 'single', marks: 10, difficultyLevel: 'easy', options: [{ text: 'var', isCorrect: false }, { text: 'let', isCorrect: true }, { text: 'const', isCorrect: false }, { text: 'static', isCorrect: false }] },
    { questionText: 'JavaScript is a synchronous, single-threaded language.', questionType: 'truefalse', marks: 10, difficultyLevel: 'medium', options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }], explanation: 'JavaScript is single-threaded; async is handled via the event loop.' },
    { questionText: 'Which methods can be used to add elements to an array? (Select all that apply)', questionType: 'multiple', marks: 20, difficultyLevel: 'medium', options: [{ text: 'push()', isCorrect: true }, { text: 'unshift()', isCorrect: true }, { text: 'pop()', isCorrect: false }, { text: 'splice()', isCorrect: true }] },
    { questionText: 'What is the output of: typeof null?', questionType: 'single', marks: 10, difficultyLevel: 'hard', options: [{ text: '"null"', isCorrect: false }, { text: '"object"', isCorrect: true }, { text: '"undefined"', isCorrect: false }, { text: '"boolean"', isCorrect: false }], explanation: 'typeof null === "object" is a known JavaScript historical bug.' },
  ];

  for (let i = 0; i < jsQuestions.length; i++) {
    await Question.create({ ...jsQuestions[i], exam: exam1._id, subject: 'Web Development', course: webCourse._id, createdBy: teacher1._id, order: i });
  }
  const totalMarks1 = jsQuestions.reduce((s, q) => s + q.marks, 0);
  await Exam.findByIdAndUpdate(exam1._id, { totalMarks: totalMarks1 });

  // ── Exam 2: HTML & CSS Basics ─────────────────────────────────────────────
  const exam2 = await Exam.create({
    title: 'HTML & CSS Basics', subject: 'Web Design',
    description: 'Fundamental concepts of HTML and CSS.',
    course: webCourse._id, assignedClasses: [class1._id], department: csDept._id,
    duration: 20, passingMarks: 50, totalMarks: 0, maxAttempts: 1,
    isPublished: true, status: 'active',
    instructions: 'Answer all questions. Each question has a single correct answer.',
    allowReview: true, showResultImmediately: true,
    createdBy: teacher1._id,
  });

  const htmlQuestions = [
    { questionText: 'What does HTML stand for?', questionType: 'single', marks: 10, difficultyLevel: 'easy', options: [{ text: 'HyperText Markup Language', isCorrect: true }, { text: 'HighText Machine Language', isCorrect: false }, { text: 'HyperText Multipage Language', isCorrect: false }, { text: 'Hyperlink and Text Markup Language', isCorrect: false }] },
    { questionText: 'Which CSS property controls the text size?', questionType: 'single', marks: 10, difficultyLevel: 'easy', options: [{ text: 'text-style', isCorrect: false }, { text: 'font-size', isCorrect: true }, { text: 'text-size', isCorrect: false }, { text: 'font-weight', isCorrect: false }] },
    { questionText: 'The <div> tag is an inline element.', questionType: 'truefalse', marks: 10, difficultyLevel: 'easy', options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }], explanation: '<div> is block-level. <span> is inline.' },
    { questionText: 'Which of the following are valid CSS display values?', questionType: 'multiple', marks: 20, difficultyLevel: 'medium', options: [{ text: 'flex', isCorrect: true }, { text: 'grid', isCorrect: true }, { text: 'table', isCorrect: true }, { text: 'column', isCorrect: false }] },
    { questionText: 'What is the correct HTML element for the largest heading?', questionType: 'single', marks: 10, difficultyLevel: 'easy', options: [{ text: '<heading>', isCorrect: false }, { text: '<h6>', isCorrect: false }, { text: '<h1>', isCorrect: true }, { text: '<head>', isCorrect: false }] },
  ];

  for (let i = 0; i < htmlQuestions.length; i++) {
    await Question.create({ ...htmlQuestions[i], exam: exam2._id, subject: 'Web Design', course: webCourse._id, createdBy: teacher1._id, order: i });
  }
  const totalMarks2 = htmlQuestions.reduce((s, q) => s + q.marks, 0);
  await Exam.findByIdAndUpdate(exam2._id, { totalMarks: totalMarks2 });

  // ── Bank questions ────────────────────────────────────────────────────────
  await Question.create({
    isInBank: true, exam: null, subject: 'Web Development', course: webCourse._id,
    chapter: 'Promises', topic: 'Async/Await', createdBy: teacher1._id,
    questionText: 'What does the async keyword do to a function?',
    questionType: 'single', marks: 5, difficultyLevel: 'medium',
    options: [
      { text: 'Makes it run in a separate thread', isCorrect: false },
      { text: 'Makes it always return a Promise', isCorrect: true },
      { text: 'Blocks execution until resolved', isCorrect: false },
      { text: 'Disables error handling', isCorrect: false },
    ],
    explanation: 'async functions always return a Promise.',
  });

  await Question.create({
    isInBank: true, exam: null, subject: 'Web Development', course: webCourse._id,
    chapter: 'DOM', topic: 'Events', createdBy: teacher1._id,
    questionText: 'Briefly explain event bubbling in JavaScript.',
    questionType: 'essay', marks: 10, difficultyLevel: 'hard',
    explanation: 'Event bubbling is when an event propagates from a child element up through its ancestors.',
  });
  console.log('✅ Exams, questions, and bank questions created');

  // ── Welcome notifications ─────────────────────────────────────────────────
  await Notification.create({
    recipient: student1._id, title: 'Welcome to ExamPortal!',
    message: 'You have 2 exams available. Click "Exams" to get started.',
    type: 'system',
  });
  await Notification.create({
    recipient: teacher1._id, title: 'Welcome, Dr. Johnson!',
    message: 'You have 2 published exams with students enrolled.',
    type: 'system',
  });

  console.log('\n✅ Seed complete. Credentials were set from your .env file.');
  console.log('   See .env.example for the required variable names.\n');
};

seed()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => setTimeout(() => process.exit(0), 1000));
