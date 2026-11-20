const Job = require('../models/Jobs');
const Application = require('../models/Application');
const { rebuildIndex } = require('../services/mlService');
const { rescoreApplicationsForJob } = require('../services/scoringService');
const { embedJob } = require('../services/embeddingService');

// Fire-and-forget: the ml-service corpus index should reflect job changes, but
// a slow/unreachable ml-service must never block a job create/update/delete response.
const triggerIndexRebuild = () => {
  rebuildIndex().catch((err) => console.error('ml-service index rebuild failed:', err.message));
};

// Create a job — recruiter only
exports.createJob = async (req, res) => {
  
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before posting a job' });
    }
    const { title, description, skillsRequired, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const job = await Job.create({
      title,
      description,
      skillsRequired,
      location,
      postedBy: req.user.id,
    });

    triggerIndexRebuild();
    res.status(201).json(job);
    embedJob(job);
  } catch (err) {
    console.error('Failed to create job:', err.message);
    res.status(500).json({ message: 'Failed to create job' });
  }
};

// Get all jobs — public, anyone can browse
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name companyName').sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Failed to fetch jobs:', err.message);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// Get a single job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name companyName');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.status(200).json(job);
  } catch (err) {
    console.error('Failed to fetch job:', err.message);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
};

// Update a job — only the recruiter who posted it
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this job' });
    }

    const { title, description, skillsRequired, location } = req.body;
    const contentChanged =
      (Boolean(title) && title !== job.title) ||
      (Boolean(description) && description !== job.description) ||
      Boolean(skillsRequired);
    if (title) job.title = title;
    if (description) job.description = description;
    if (skillsRequired) job.skillsRequired = skillsRequired;
    if (location) job.location = location;

    await job.save();
    triggerIndexRebuild();
    if (contentChanged) {
      rescoreApplicationsForJob(job._id).catch((err) =>
        console.error('Failed to rescore applications after job update:', err.message)
      );
    }
    res.status(200).json(job);
    if (contentChanged) embedJob(job);
  } catch (err) {
    console.error('Failed to update job:', err.message);
    res.status(500).json({ message: 'Failed to update job' });
  }
};

// Delete a job — only the recruiter who posted it
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    await Application.deleteMany({ job: job._id });
    triggerIndexRebuild();
    res.status(200).json({ message: 'Job deleted' });
  } catch (err) {
    console.error('Failed to delete job:', err.message);
    res.status(500).json({ message: 'Failed to delete job' });
  }
};