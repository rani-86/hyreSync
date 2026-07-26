const Application = require('../models/Application');
const Job = require('../models/Jobs');
const axios = require('axios');

// Candidate applies to a job
exports.applyToJob = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before applying to jobs' });
    }
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const existing = await Application.findOne({ job: jobId, candidate: req.user.id });
    if (existing) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }
    const application = await Application.create({
      job: jobId,
      candidate: req.user.id,
    });
    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }
    res.status(500).json({ message: 'Failed to apply', error: err.message });
  }
};

// Candidate views their own applications
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title location')
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
  }
};

// Recruiter views applicants for a specific job they posted
exports.getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view applicants for this job' });
    }
    const applications = await Application.find({ job: jobId })
      .populate('candidate', 'name email resumeUrl')
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applicants', error: err.message });
  }
};

// Recruiter views applicants for a job, each with an ML-computed fit score and LLM explanation
exports.getApplicantsWithFitScores = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view applicants for this job' });
    }
    const applications = await Application.find({ job: jobId })
      .populate('candidate', 'name email resumeUrl');

    const results = await Promise.all(
      applications.map(async (app) => {
        if (!app.candidate.resumeUrl) {
          return { ...app.toObject(), fitScore: null, explanation: null };
        }
        try {
          const mlRes =  await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/fit-score`, {
            resume_url: app.candidate.resumeUrl,
            job_description: job.description,
          });
          return {
            ...app.toObject(),
            fitScore: mlRes.data.fit_score,
            explanation: mlRes.data.explanation,
          };
        } catch (err) {
          return { ...app.toObject(), fitScore: null, explanation: null };
        }
      })
    );

    results.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applicants with fit scores', error: err.message });
  }
};