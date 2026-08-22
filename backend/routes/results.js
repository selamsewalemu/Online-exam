const express = require('express');
const router = express.Router();
const {
  startExam, submitExam, gradeResult,
  getMyResults, getResult, getExamResults, getAllResults,
  getExamAnalytics, getStudentHistory,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student actions
router.post('/start', startExam);
router.get('/my', getMyResults);
router.get('/student/:studentId/history', getStudentHistory);
router.post('/:id/submit', submitExam);

// Teacher/Admin actions
router.get('/', authorize('admin', 'teacher'), getAllResults);
router.post('/:id/grade', authorize('admin', 'teacher'), gradeResult);
router.get('/exam/:examId', authorize('admin', 'teacher'), getExamResults);
router.get('/analytics/:examId', authorize('admin', 'teacher'), getExamAnalytics);

// Must come last (wildcard)
router.get('/:id', getResult);

module.exports = router;
