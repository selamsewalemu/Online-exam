const Question = require('../models/Question');
const Exam = require('../models/Exam');

// Recompute exam totalMarks
const syncExamTotalMarks = async (examId) => {
  if (!examId) return;
  const questions = await Question.find({ exam: examId });
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  await Exam.findByIdAndUpdate(examId, { totalMarks });
};

// ─── QUESTION BANK ────────────────────────────────────────────────────────────

// GET /api/questions/bank  — list bank questions with filters
const getBankQuestions = async (req, res, next) => {
  try {
    const { subject, course, difficulty, type, search, page = 1, limit = 30 } = req.query;
    const filter = { isInBank: true };
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (course) filter.course = course;
    if (difficulty) filter.difficultyLevel = difficulty;
    if (type) filter.questionType = type;
    if (search) filter.questionText = { $regex: search, $options: 'i' };

    // Teacher can only see questions they created
    if (req.user.role === 'teacher') filter.createdBy = req.user._id;

    const questions = await Question.find(filter)
      .populate('createdBy', 'name')
      .populate('course', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Question.countDocuments(filter);
    res.json({ success: true, count: questions.length, total, questions });
  } catch (e) { next(e); }
};

// POST /api/questions/bank  — add to bank
const createBankQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({
      ...req.body,
      isInBank: true,
      exam: null,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, question });
  } catch (e) { next(e); }
};

// POST /api/questions/bank/bulk  — bulk import
const bulkCreateBankQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    const withMeta = questions.map(q => ({ ...q, isInBank: true, exam: null, createdBy: req.user._id }));
    const created = await Question.insertMany(withMeta);
    res.status(201).json({ success: true, count: created.length, questions: created });
  } catch (e) { next(e); }
};

// POST /api/questions/bank/:id/add-to-exam  — copy a bank question into an exam
const addBankQuestionToExam = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const bankQ = await Question.findById(req.params.id);
    if (!bankQ) return res.status(404).json({ success: false, message: 'Question not found' });

    const count = await Question.countDocuments({ exam: examId });
    const examQ = await Question.create({
      exam: examId,
      isInBank: false,
      subject: bankQ.subject,
      course: bankQ.course,
      chapter: bankQ.chapter,
      topic: bankQ.topic,
      questionText: bankQ.questionText,
      questionType: bankQ.questionType,
      options: bankQ.options,
      matchingPairs: bankQ.matchingPairs,
      correctAnswerText: bankQ.correctAnswerText,
      marks: bankQ.marks,
      explanation: bankQ.explanation,
      difficultyLevel: bankQ.difficultyLevel,
      createdBy: req.user._id,
      order: count,
    });
    await syncExamTotalMarks(examId);
    res.status(201).json({ success: true, question: examQ });
  } catch (e) { next(e); }
};

// ─── EXAM QUESTIONS ───────────────────────────────────────────────────────────

// POST /api/questions  — add question directly to exam
const createQuestion = async (req, res, next) => {
  try {
    const { exam: examId } = req.body;
    const count = await Question.countDocuments({ exam: examId });
    const question = await Question.create({
      ...req.body,
      isInBank: false,
      createdBy: req.user._id,
      order: count,
    });
    await syncExamTotalMarks(examId);
    res.status(201).json({ success: true, question });
  } catch (e) { next(e); }
};

// POST /api/questions/bulk
const createBulkQuestions = async (req, res, next) => {
  try {
    const { examId, questions } = req.body;
    const currentCount = await Question.countDocuments({ exam: examId });
    const withMeta = questions.map((q, i) => ({
      ...q, exam: examId, isInBank: false, createdBy: req.user._id, order: currentCount + i,
    }));
    const created = await Question.insertMany(withMeta);
    await syncExamTotalMarks(examId);
    res.status(201).json({ success: true, count: created.length, questions: created });
  } catch (e) { next(e); }
};

// GET /api/questions/:id
const getQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id).populate('createdBy', 'name');
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question: q });
  } catch (e) { next(e); }
};

// PUT /api/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    if (q.exam) await syncExamTotalMarks(q.exam);
    res.json({ success: true, question: q });
  } catch (e) { next(e); }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    const examId = q.exam;
    await q.deleteOne();
    if (examId) await syncExamTotalMarks(examId);
    res.json({ success: true, message: 'Question deleted' });
  } catch (e) { next(e); }
};

module.exports = {
  getBankQuestions, createBankQuestion, bulkCreateBankQuestions, addBankQuestionToExam,
  createQuestion, createBulkQuestions, getQuestion, updateQuestion, deleteQuestion,
};
