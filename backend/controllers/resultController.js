const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Notification = require('../models/Notification');

// Helper: apply grading scale
const computeGrade = (percentage, gradingScale) => {
  if (!gradingScale || gradingScale.length === 0) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }
  const match = gradingScale.find(g => percentage >= g.minPercent && percentage <= g.maxPercent);
  return match ? match.grade : 'F';
};

// POST /api/results/start
const startExam = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam || !exam.isPublished)
      return res.status(404).json({ success: false, message: 'Exam not available' });

    const attemptCount = await Result.countDocuments({
      exam: examId, student: req.user._id,
      status: { $in: ['submitted', 'timed-out'] },
    });

    if (attemptCount >= exam.maxAttempts)
      return res.status(400).json({ success: false, message: `Maximum ${exam.maxAttempts} attempt(s) allowed` });

    // Resume existing in-progress attempt
    const inProgress = await Result.findOne({ exam: examId, student: req.user._id, status: 'in-progress' });
    if (inProgress) return res.json({ success: true, message: 'Resuming attempt', result: inProgress });

    const result = await Result.create({
      exam: examId, student: req.user._id,
      startedAt: new Date(), attemptNumber: attemptCount + 1, totalMarks: exam.totalMarks,
    });
    res.status(201).json({ success: true, result });
  } catch (e) { next(e); }
};

// POST /api/results/:id/submit
const submitExam = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (result.student.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (result.status !== 'in-progress')
      return res.status(400).json({ success: false, message: 'Exam already submitted' });

    const { answers, timeTaken } = req.body;
    const exam = await Exam.findById(result.exam);
    const questions = await Question.find({ exam: result.exam });
    const qMap = {};
    questions.forEach(q => { qMap[q._id.toString()] = q; });

    let obtainedMarks = 0;
    let needsManualGrading = false;
    const processedAnswers = [];

    for (const ans of answers) {
      const q = qMap[ans.questionId];
      if (!q) continue;

      let isCorrect = false;
      let marksObtained = 0;
      let needsManual = false;

      if (['single', 'truefalse'].includes(q.questionType)) {
        const correctIds = q.options.filter(o => o.isCorrect).map(o => o._id.toString());
        const selected = (ans.selectedOptions || []).map(id => id.toString());
        isCorrect = selected.length === 1 && correctIds.includes(selected[0]);
        marksObtained = isCorrect ? q.marks : 0;

      } else if (q.questionType === 'multiple') {
        const correctIds = q.options.filter(o => o.isCorrect).map(o => o._id.toString());
        const selected = (ans.selectedOptions || []).map(id => id.toString());
        isCorrect = selected.length === correctIds.length && selected.every(id => correctIds.includes(id));
        marksObtained = isCorrect ? q.marks : 0;

      } else if (['essay', 'shortanswer', 'fillinblank'].includes(q.questionType)) {
        needsManual = true;
        needsManualGrading = true;
        // Auto-grade fill-in-blank if correctAnswerText set
        if (q.questionType === 'fillinblank' && q.correctAnswerText) {
          isCorrect = (ans.textAnswer || '').trim().toLowerCase() === q.correctAnswerText.trim().toLowerCase();
          marksObtained = isCorrect ? q.marks : 0;
          needsManual = false;
        }
      }

      // Update question analytics
      await Question.findByIdAndUpdate(q._id, {
        $inc: { timesAnswered: 1, ...(isCorrect ? { timesCorrect: 1 } : {}) },
      });

      obtainedMarks += marksObtained;
      processedAnswers.push({
        question: q._id,
        selectedOptions: ans.selectedOptions || [],
        textAnswer: ans.textAnswer || '',
        matchingAnswers: ans.matchingAnswers || [],
        isCorrect,
        marksObtained,
        needsManualGrading: needsManual,
        feedback: '',
      });
    }

    const percentage = exam.totalMarks > 0 ? Math.round((obtainedMarks / exam.totalMarks) * 100) : 0;

    result.answers = processedAnswers;
    result.obtainedMarks = obtainedMarks;
    result.totalMarks = exam.totalMarks;
    result.isPassed = obtainedMarks >= exam.passingMarks;
    result.timeTaken = timeTaken || 0;
    result.submittedAt = new Date();
    result.status = 'submitted';
    result.grade = computeGrade(percentage, exam.gradingScale);
    result.gradingStatus = needsManualGrading ? 'pending-review' : 'auto-graded';

    await result.save();

    // Notify student if results shown immediately
    if (exam.showResultImmediately) {
      await Notification.create({
        recipient: req.user._id,
        title: 'Exam Submitted',
        message: `You scored ${obtainedMarks}/${exam.totalMarks} (${percentage}%) in "${exam.title}"`,
        type: 'result',
        link: `/results/${result._id}`,
      });
    }

    res.json({
      success: true, message: 'Exam submitted',
      result: {
        _id: result._id, obtainedMarks, totalMarks: exam.totalMarks,
        percentage, isPassed: result.isPassed, grade: result.grade,
        gradingStatus: result.gradingStatus,
      },
    });
  } catch (e) { next(e); }
};

// POST /api/results/:id/grade  — teacher/admin manually grades essay answers
const gradeResult = async (req, res, next) => {
  try {
    const { answers, overallFeedback } = req.body;
    // answers: [{ questionId, manualMarks, feedback }]
    const result = await Result.findById(req.params.id).populate('exam');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    let obtainedMarks = 0;
    result.answers = result.answers.map(ans => {
      const grade = answers.find(a => a.questionId === ans.question.toString());
      if (grade && ans.needsManualGrading) {
        ans.manualMarks = grade.manualMarks;
        ans.feedback = grade.feedback || '';
        ans.isCorrect = grade.manualMarks > 0;
        ans.marksObtained = grade.manualMarks;
      }
      obtainedMarks += ans.manualMarks !== null && ans.manualMarks !== undefined
        ? ans.manualMarks : ans.marksObtained;
      return ans;
    });

    result.obtainedMarks = obtainedMarks;
    result.overallFeedback = overallFeedback || '';
    result.gradedBy = req.user._id;
    result.gradedAt = new Date();
    result.gradingStatus = 'fully-graded';
    result.isPassed = obtainedMarks >= result.exam.passingMarks;
    result.grade = computeGrade(result.percentage, result.exam.gradingScale);

    await result.save();

    // Notify student
    await Notification.create({
      recipient: result.student,
      title: 'Exam Graded',
      message: `Your exam "${result.exam.title}" has been graded. Score: ${obtainedMarks}/${result.totalMarks}`,
      type: 'grade',
      link: `/results/${result._id}`,
    });

    res.json({ success: true, message: 'Result graded', result });
  } catch (e) { next(e); }
};

// GET /api/results/my
const getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({
      student: req.user._id, status: { $in: ['submitted', 'timed-out'] },
    })
      .populate('exam', 'title subject duration passingMarks totalMarks showResultImmediately')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: results.length, results });
  } catch (e) { next(e); }
};

// GET /api/results/:id
const getResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('exam', 'title subject passingMarks totalMarks gradingScale showResultImmediately allowReview')
      .populate('student', 'name email studentId')
      .populate('gradedBy', 'name')
      .populate({ path: 'answers.question', select: 'questionText options marks questionType explanation correctAnswerText matchingPairs difficultyLevel' });

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    const isOwner = result.student._id.toString() === req.user._id.toString();
    if (req.user.role === 'student' && !isOwner)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, result });
  } catch (e) { next(e); }
};

// GET /api/results/exam/:examId
const getExamResults = async (req, res, next) => {
  try {
    const results = await Result.find({ exam: req.params.examId, status: { $in: ['submitted', 'timed-out'] } })
      .populate('student', 'name email studentId')
      .sort({ obtainedMarks: -1 });
    res.json({ success: true, count: results.length, results });
  } catch (e) { next(e); }
};

// GET /api/results
const getAllResults = async (req, res, next) => {
  try {
    const { examId, status, gradingStatus, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (examId) filter.exam = examId;
    if (status) filter.status = status;
    else filter.status = { $in: ['submitted', 'timed-out'] };
    if (gradingStatus) filter.gradingStatus = gradingStatus;

    // Teachers only see results for their exams
    if (req.user.role === 'teacher') {
      const Exam = require('../models/Exam');
      const myExams = await Exam.find({ createdBy: req.user._id }).select('_id');
      filter.exam = { $in: myExams.map(e => e._id) };
    }

    const results = await Result.find(filter)
      .populate('exam', 'title subject')
      .populate('student', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Result.countDocuments(filter);
    res.json({ success: true, count: results.length, total, results });
  } catch (e) { next(e); }
};

// GET /api/results/analytics/:examId  — detailed exam analytics
const getExamAnalytics = async (req, res, next) => {
  try {
    const results = await Result.find({
      exam: req.params.examId, status: { $in: ['submitted', 'timed-out'] },
    }).populate('answers.question', 'questionText marks difficultyLevel');

    if (results.length === 0)
      return res.json({ success: true, analytics: null, message: 'No submissions yet' });

    const scores = results.map(r => r.obtainedMarks);
    const percentages = results.map(r => r.percentage);
    const passed = results.filter(r => r.isPassed).length;

    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const avgPercent = Math.round(percentages.reduce((s, v) => s + v, 0) / percentages.length);

    // Grade distribution
    const gradeDist = {};
    results.forEach(r => { gradeDist[r.grade] = (gradeDist[r.grade] || 0) + 1; });

    // Question-level analysis
    const questionStats = {};
    results.forEach(result => {
      result.answers.forEach(ans => {
        if (!ans.question) return;
        const qId = ans.question._id.toString();
        if (!questionStats[qId]) {
          questionStats[qId] = {
            questionText: ans.question.questionText,
            marks: ans.question.marks,
            difficultyLevel: ans.question.difficultyLevel,
            totalAttempts: 0, correctAttempts: 0,
          };
        }
        questionStats[qId].totalAttempts++;
        if (ans.isCorrect) questionStats[qId].correctAttempts++;
      });
    });

    const questionAnalysis = Object.entries(questionStats).map(([id, stat]) => ({
      questionId: id,
      questionText: stat.questionText,
      marks: stat.marks,
      difficultyLevel: stat.difficultyLevel,
      correctPercent: stat.totalAttempts > 0
        ? Math.round((stat.correctAttempts / stat.totalAttempts) * 100) : 0,
      totalAttempts: stat.totalAttempts,
      correctAttempts: stat.correctAttempts,
      difficultyIndex: stat.totalAttempts > 0
        ? Math.round((stat.correctAttempts / stat.totalAttempts) * 100) : null,
    }));

    res.json({
      success: true,
      analytics: {
        totalSubmissions: results.length,
        passed, failed: results.length - passed,
        passRate: Math.round((passed / results.length) * 100),
        avgScore: Math.round(avg * 10) / 10,
        avgPercent,
        highest, lowest,
        gradeDist,
        questionAnalysis,
      },
    });
  } catch (e) { next(e); }
};

// GET /api/results/student/:studentId/history
const getStudentHistory = async (req, res, next) => {
  try {
    const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;
    const results = await Result.find({
      student: studentId, status: { $in: ['submitted', 'timed-out'] },
    })
      .populate('exam', 'title subject category duration')
      .sort({ createdAt: -1 });

    const total = results.length;
    const passed = results.filter(r => r.isPassed).length;
    const avgPercent = total
      ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / total) : 0;

    res.json({ success: true, results, summary: { total, passed, failed: total - passed, avgPercent } });
  } catch (e) { next(e); }
};

module.exports = {
  startExam, submitExam, gradeResult,
  getMyResults, getResult, getExamResults, getAllResults,
  getExamAnalytics, getStudentHistory,
};
