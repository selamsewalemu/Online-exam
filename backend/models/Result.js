const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    // For MCQ / TF / multiple
    selectedOptions: [{ type: mongoose.Schema.Types.ObjectId }],
    // For short answer / essay / fillinblank
    textAnswer: { type: String, default: '' },
    // For matching
    matchingAnswers: [{ left: String, right: String }],

    isCorrect: { type: Boolean, default: false },
    // For auto-graded questions
    marksObtained: { type: Number, default: 0 },
    // For manually graded questions (essay / short answer)
    manualMarks: { type: Number, default: null },
    feedback: { type: String, default: '' },
    needsManualGrading: { type: Boolean, default: false },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],

    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: '' },
    isPassed: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 }, // seconds

    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },

    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'timed-out', 'grading-pending'],
      default: 'in-progress',
    },
    gradingStatus: {
      type: String,
      enum: ['auto-graded', 'pending-review', 'fully-graded'],
      default: 'auto-graded',
    },

    attemptNumber: { type: Number, default: 1 },

    // Teacher feedback on the whole result
    overallFeedback: { type: String, default: '' },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 });
resultSchema.index({ student: 1, status: 1 });
resultSchema.index({ gradingStatus: 1 });

resultSchema.pre('save', function (next) {
  if (this.totalMarks > 0) {
    this.percentage = Math.round((this.obtainedMarks / this.totalMarks) * 100);
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);
