const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');

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

module.exports = { getExams, getExam, createExam, updateExam, deleteExam, getExamQuestions, getExamStats, monitorExam };
