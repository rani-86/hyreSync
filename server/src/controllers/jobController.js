const Job = require('../models/Jobs');

// Create a job — recruiter only
exports.createJob = async (req, res) => {
  try {
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

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job', error: err.message });
  }
};

// Get all jobs — public, anyone can browse
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name companyName').sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err.message });
  }
};

// Get a single job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name companyName');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job', error: err.message });
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
    if (title) job.title = title;
    if (description) job.description = description;
    if (skillsRequired) job.skillsRequired = skillsRequired;
    if (location) job.location = location;

    await job.save();
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job', error: err.message });
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
    res.status(200).json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job', error: err.message });
  }
};