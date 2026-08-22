const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    // Linked to an exam OR stored in the global question bank
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
    // Question bank metadata
    isInBank: { type: Boolean, default: false },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    subject: { type: String, trim: true },
    chapter: { type: String, trim: true, default: '' },
    topic: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    questionText: { type: String, required: true, trim: true },
    questionType: {
      type: String,
      enum: ['single', 'multiple', 'truefalse', 'shortanswer', 'essay', 'matching', 'fillinblank'],
      default: 'single',
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    // For matching questions: pairs
    matchingPairs: [
      {
        left: String,
        right: String,
      },
    ],
    // Correct answer text for shortanswer / fillinblank
    correctAnswerText: { type: String, default: '' },

    marks: { type: Number, default: 1, min: 1 },
    negativeMark: { type: Number, default: 0, min: 0 },
    explanation: { type: String, default: '' },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    order: { type: Number, default: 0 },

    // Analytics (updated on each submission)
    timesAnswered: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Computed difficulty index (timesCorrect / timesAnswered)
questionSchema.virtual('difficultyIndex').get(function () {
  if (this.timesAnswered === 0) return null;
  return Math.round((this.timesCorrect / this.timesAnswered) * 100);
});

questionSchema.index({ exam: 1, order: 1 });
questionSchema.index({ isInBank: 1, subject: 1, difficultyLevel: 1 });

module.exports = mongoose.model('Question', questionSchema);
