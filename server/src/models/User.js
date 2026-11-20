const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['recruiter', 'candidate'],
      required: true,
    },
    resumeUrl: {
      type: String,
      default: null,
    },
    // Text extracted from the resume PDF once at upload time, so applications
    // don't need to re-download/re-parse the PDF on every score.
    resumeText: {
      type: String,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    domainsOfInterest: {
      type: [String],
      default: [],
    },
    education: [
      {
        degree: { type: String },
        institution: { type: String },
        year: { type: String },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpiry: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);