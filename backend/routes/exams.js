const express = require('express');
const router = express.Router();
const {
  getExams, getExam, createExam, importExam, updateExam, deleteExam,
  getExamQuestions, getExamStats, monitorExam,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

router.get('/stats', authorize('admin', 'teacher'), getExamStats);
router.get('/', getExams);
router.post('/', authorize('admin', 'teacher'), createExam);
router.post('/import', authorize('admin', 'teacher'), upload.single('file'), importExam);
router.get('/:id', getExam);
router.put('/:id', authorize('admin', 'teacher'), updateExam);
router.delete('/:id', authorize('admin', 'teacher'), deleteExam);
router.get('/:id/questions', getExamQuestions);
router.get('/:id/monitor', authorize('admin', 'teacher'), monitorExam);

module.exports = router;
