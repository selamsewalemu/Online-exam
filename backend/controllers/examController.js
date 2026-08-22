const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const mammoth = require('mammoth');

const cleanImportedText = (value) => value
  .replace(/\\par[d]?/g, '\n')
  .replace(/\\[a-z]+\d* ?/gi, '')
  .replace(/[{}]/g, '')
  .replace(/\r/g, '');

const parseImportedExamText = (text) => {
  const exam = { title: '', subject: '', description: '', category: 'General', duration: 30, passingMarks: 40, instructions: '' };
  const questions = [];
  let question = null;
  const finishQuestion = () => { if (question?.questionText) questions.push(question); question = null; };
  cleanImportedText(text).split('\n').map(line => line.trim()).filter(Boolean).forEach(line => {
    const field = line.match(/^([^:]+):\s*(.*)$/);
    if (!field) return;
    const label = field[1].toLowerCase();
    const value = field[2].trim();
    if (label === 'question') {
      finishQuestion();
      question = { questionText: value, questionType: 'single', difficultyLevel: 'medium', marks: 1, options: [], matchingPairs: [], correctAnswerText: '', explanation: '' };
    } else if (question && label === 'type') question.questionType = value.toLowerCase();
    else if (question && label === 'difficulty') question.difficultyLevel = value.toLowerCase();
    else if (question && label === 'marks') question.marks = Number(value) || 1;
    else if (question && /^option [a-z]+$/.test(label)) {
      const [optionText, correct = 'no'] = value.split('|').map(part => part.trim());
      question.options.push({ text: optionText, isCorrect: correct.toLowerCase() === 'yes' });
    } else if (question && /^pair \d+$/.test(label)) {
      const [left, right] = value.split('->').map(part => part.trim());
      question.matchingPairs.push({ left, right });
    } else if (question && (label === 'correct answer' || label === 'model answer')) question.correctAnswerText = value;
    else if (question && label === 'explanation') question.explanation = value;
    else if (label === 'title') exam.title = value;
    else if (label === 'subject') exam.subject = value;
    else if (label === 'description') exam.description = value;
    else if (label === 'category') exam.category = value || 'General';
    else if (label === 'duration') exam.duration = Number(value) || 30;
    else if (label === 'passing marks') exam.passingMarks = Number(value) || 0;
    else if (label === 'instructions') exam.instructions = value;
  });
  finishQuestion();
  return { exam, questions };
};

const readImportedExam = async (file) => {
  const extension = file.originalname.toLowerCase().split('.').pop();
  if (extension === 'json') return JSON.parse(file.buffer.toString('utf8'));
  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return parseImportedExamText(result.value);
  }
  if (extension === 'rtf' || extension === 'txt') return parseImportedExamText(file.buffer.toString('utf8'));
  throw new Error('Supported file types are .json, .docx, .rtf, and .txt');
};

// Determine which exams a student can access
const buildStudentFilter = async (userId) => {
  const student = await User.findById(userId).select('enrolledClasses enrolledCourses');
  return {
    isPublished: true,
    $or: [
      { assignedClasses: { $in: student.enrolledClasses } },
      { course: { $in: student.enrolledCourses } },
      { assignedClasses: { $size: 0 }, course: null }, // open to all
    ],
  };
};

// GET /api/exams
const getExams = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher') filter.createdBy = req.user._id;
    else if (req.user.role === 'student') filter = await buildStudentFilter(req.user._id);

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name email')
      .populate('course', 'name')
      .populate('assignedClasses', 'name')
      .populate('questionCount')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (e) { next(e); }
};

// GET /api/exams/:id
const getExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('course', 'name')
      .populate('assignedClasses', 'name')
      .populate('department', 'name')
      .populate('questionCount');

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'student' && !exam.isPublished)
      return res.status(403).json({ success: false, message: 'Exam is not available' });

    res.json({ success: true, exam });
  } catch (e) { next(e); }
};

// POST /api/exams
const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, exam });
  } catch (e) { next(e); }
};

// POST /api/exams/import — create a draft exam and its questions from a file
const importExam = async (req, res, next) => {
  let exam;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please select an exam file' });
    const imported = await readImportedExam(req.file);
    const examData = imported.exam || imported;
    const questions = imported.questions || [];
    if (!examData.title || !examData.subject || !questions.length)
      return res.status(400).json({ success: false, message: 'File needs title, subject, and at least one question' });

    exam = await Exam.create({
      title: examData.title, subject: examData.subject, description: examData.description || '',
      category: examData.category || 'General', duration: Number(examData.duration) || 30,
      passingMarks: Number(examData.passingMarks) || 0, instructions: examData.instructions || '',
      maxAttempts: Number(examData.maxAttempts) || 1, isPublished: false, createdBy: req.user._id,
    });
    const examQuestions = questions.map((question, index) => ({
      ...question, exam: exam._id, isInBank: false, createdBy: req.user._id, order: index,
    }));
    const createdQuestions = await Question.insertMany(examQuestions);
    exam.totalMarks = createdQuestions.reduce((total, question) => total + question.marks, 0);
    await exam.save();
    res.status(201).json({ success: true, exam, count: createdQuestions.length });
  } catch (e) {
    if (exam?._id) await Question.deleteMany({ exam: exam._id }).catch(() => {});
    if (exam?._id) await Exam.findByIdAndDelete(exam._id).catch(() => {});
    next(e);
  }
};

// PUT /api/exams/:id
const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Teachers can only edit their own exams
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    // Recompute total marks when publishing
    if (req.body.isPublished) {
      const questions = await Question.find({ exam: exam._id });
      req.body.totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    }

    // Auto set status
    if (req.body.scheduledStart && req.body.scheduledEnd) req.body.status = 'scheduled';
    if (req.body.isPublished && !req.body.scheduledStart) req.body.status = 'active';

    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, exam: updated });
  } catch (e) { next(e); }
};

// DELETE /api/exams/:id
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await Question.deleteMany({ exam: exam._id });
    await Result.deleteMany({ exam: exam._id });
    await exam.deleteOne();
    res.json({ success: true, message: 'Exam deleted' });
  } catch (e) { next(e); }
};

// GET /api/exams/:id/questions  — strips correct answers for students
const getExamQuestions = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'student' && !exam.isPublished)
      return res.status(403).json({ success: false, message: 'Exam not available' });

    let questions = await Question.find({ exam: exam._id }).sort({ order: 1 });

    if (exam.shuffleQuestions && req.user.role === 'student')
      questions = questions.sort(() => Math.random() - 0.5);

    if (req.user.role === 'student') {
      questions = questions.map((q) => {
        const qObj = q.toObject();
        if (['single', 'multiple', 'truefalse'].includes(qObj.questionType)) {
          qObj.options = qObj.options.map(({ _id, text }) => ({ _id, text }));
        }
        delete qObj.correctAnswerText;
        delete qObj.explanation;
        delete qObj.matchingPairs; // will be handled separately if needed
        return qObj;
      });
    }
    res.json({ success: true, count: questions.length, questions });
  } catch (e) { next(e); }
};

// GET /api/exams/stats  — admin/teacher stats
const getExamStats = async (req, res, next) => {
  try {
    const createdByFilter = req.user.role === 'teacher' ? { createdBy: req.user._id } : {};
    const totalExams = await Exam.countDocuments(createdByFilter);
    const publishedExams = await Exam.countDocuments({ ...createdByFilter, isPublished: true });
    const totalResults = await Result.countDocuments({ status: { $in: ['submitted', 'timed-out'] } });
    const totalQuestions = await Question.countDocuments({ isInBank: false, ...createdByFilter });
    const bankQuestions = await Question.countDocuments({ isInBank: true, ...(req.user.role === 'teacher' ? { createdBy: req.user._id } : {}) });
    const pendingGrading = await Result.countDocuments({ gradingStatus: 'pending-review' });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

    res.json({ success: true, stats: { totalExams, publishedExams, totalResults, totalQuestions, bankQuestions, pendingGrading, totalStudents } });
  } catch (e) { next(e); }
};

// GET /api/exams/:id/monitor  — real-time monitor: in-progress results
const monitorExam = async (req, res, next) => {
  try {
    const inProgress = await Result.find({ exam: req.params.id, status: 'in-progress' })
      .populate('student', 'name email studentId')
      .sort({ startedAt: 1 });

    const submitted = await Result.countDocuments({ exam: req.params.id, status: { $in: ['submitted', 'timed-out'] } });
    res.json({ success: true, inProgress, submittedCount: submitted });
  } catch (e) { next(e); }
};

module.exports = { getExams, getExam, createExam, importExam, updateExam, deleteExam, getExamQuestions, getExamStats, monitorExam };
