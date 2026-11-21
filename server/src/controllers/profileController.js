const User = require('../models/User');

const Job = require('../models/Jobs');
const { getRecommendations } = require('../services/mlService');

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

    if (!profileText.trim() && !user.resumeText) {
      return res.status(400).json({ message: 'Please add skills or interests to your profile first' });
    }

    const jobs = await Job.find().populate('postedBy', 'name');

    // One batch call ranks every job at once, instead of one HTTP request per job.
    const mlRes = await getRecommendations({
      profileText,
      resumeText: user.resumeText || '',
      resumeEmbedding: user.resumeEmbedding?.length ? user.resumeEmbedding : undefined,
      candidateSkills: user.skills || [],
      jobs: jobs.map((job) => ({
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        skills_required: job.skillsRequired || [],
        embedding: job.embedding?.length ? job.embedding : undefined,
      })),
    });

    const jobById = new Map(jobs.map((job) => [job._id.toString(), job]));
    const results = mlRes.data.results
      .map((r) => ({
        job: jobById.get(r.job_id),
        score: r.score,
        breakdown: r.breakdown,
        scoringMethod: r.scoring_method,
      }))
      .filter((r) => r.job);

    res.status(200).json(results);
  } catch (err) {
    console.error('Failed to fetch recommendations:', err.message);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
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
    console.error('Failed to update profile:', err.message);
    res.status(500).json({ message: 'Failed to update profile' });
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
    console.error('Failed to fetch profile:', err.message);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};