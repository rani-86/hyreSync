const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    fitScore: {
      type: Number,
      default: null,
    },
    explanation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    scoringMethod: {
      type: String,
      default: null,
    },
    // Per-signal score breakdown, e.g. { semantic: 62, lexical: 40, skills: 80 }
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    scoredAt: {
      type: Date,
      default: null,
    },
    scoringStatus: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent the same candidate from applying to the same job twice
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
