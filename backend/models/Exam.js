const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },
    subject: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },

    duration: { type: Number, required: true, min: 1 }, // minutes
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, required: true, min: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    isPublished: { type: Boolean, default: false },
    // Scheduling
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },

    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1 },
    instructions: { type: String, default: '' },
    category: { type: String, default: 'General' },

    // Grading config
    gradingScale: [
      {
        grade: String,    // e.g. 'A', 'B', 'C'
        minPercent: Number,
        maxPercent: Number,
      },
    ],
    allowReview: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: true },
    // Browser restriction / anti-cheat
    browserRestriction: { type: Boolean, default: false },
    // Auto-submit on time up
    autoSubmit: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'completed', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

examSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'exam',
  count: true,
});

examSchema.index({ isPublished: 1, createdAt: -1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ 'assignedClasses': 1 });

module.exports = mongoose.model('Exam', examSchema);
