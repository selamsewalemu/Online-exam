const express = require('express');
const router = express.Router();
const {
  getBankQuestions, createBankQuestion, bulkCreateBankQuestions, importBankQuestions, addBankQuestionToExam,
  createQuestion, createBulkQuestions, getQuestion, updateQuestion, deleteQuestion,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect, authorize('admin', 'teacher'));

// Question bank
router.get('/bank', getBankQuestions);
router.post('/bank', createBankQuestion);
router.post('/bank/bulk', bulkCreateBankQuestions);
router.post('/bank/import', upload.single('file'), importBankQuestions);
router.post('/bank/:id/add-to-exam', addBankQuestionToExam);

// Exam questions
router.post('/', createQuestion);
router.post('/bulk', createBulkQuestions);
router.get('/:id', getQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
