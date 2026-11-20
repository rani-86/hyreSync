const User = require('../models/User');

const Job = require('../models/Jobs');
const { getRecommendScore } = require('../services/mlService');

exports.getRecommendedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileText = [
      ...(user.skills || []),
      ...(user.domainsOfInterest || []),
    ].join(' ');

    if (!profileText.trim()) {
      return res.status(400).json({ message: 'Please add skills or interests to your profile first' });
    }

    const jobs = await Job.find().populate('postedBy', 'name');

    const results = await Promise.all(
      jobs.map(async (job) => {
        try {
          const mlRes = await getRecommendScore({
            profileText,
            jobDescription: `${job.title} ${job.description} ${job.skillsRequired.join(' ')}`,
            jobId: job._id.toString(),
          });
          return { job, score: mlRes.data.score };
        } catch (err) {
          return { job, score: null };
        }
      })
    );

    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recommendations', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { skills, domainsOfInterest, education } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (skills) user.skills = skills;
    if (domainsOfInterest) user.domainsOfInterest = domainsOfInterest;
    if (education) user.education = education;

    await user.save();

    const { password, ...safeUser } = user.toObject();
    res.status(200).json(safeUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};