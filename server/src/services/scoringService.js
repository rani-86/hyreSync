const Application = require('../models/Application');
const { getFitScore } = require('./mlService');

const MAX_ATTEMPTS = 2;

// Scores a single application and persists the result. Never throws —
// callers fire this in the background and must not depend on its outcome.
const scoreApplication = async (applicationId, attempt = 1) => {
  let application;
  try {
    application = await Application.findById(applicationId).populate('job').populate('candidate');
    if (!application || !application.job || !application.candidate) return;

    const { job, candidate } = application;
    if (!candidate.resumeUrl) {
      application.scoringStatus = 'failed';
      await application.save();
      return;
    }

    const mlRes = await getFitScore({
      resumeText: candidate.resumeText || undefined,
      resumeUrl: candidate.resumeText ? undefined : candidate.resumeUrl,
      resumeEmbedding: candidate.resumeEmbedding?.length ? candidate.resumeEmbedding : undefined,
      jobDescription: job.description,
      jobId: job._id.toString(),
      jobEmbedding: job.embedding?.length ? job.embedding : undefined,
      jobSkills: job.skillsRequired || [],
      candidateSkills: candidate.skills || [],
    });

    application.fitScore = mlRes.data.fit_score;
    application.explanation = mlRes.data.explanation;
    application.scoringMethod = mlRes.data.scoring_method;
    application.scoreBreakdown = mlRes.data.breakdown;
    application.scoredAt = new Date();
    application.scoringStatus = 'done';
    await application.save();
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      await scoreApplication(applicationId, attempt + 1);
      return;
    }
    console.error(`Scoring failed for application ${applicationId}:`, err.message);
    await Application.findByIdAndUpdate(applicationId, { scoringStatus: 'failed' }).catch(() => {});
  }
};

// Fire-and-forget entry point: never await this in a request handler.
const scheduleScoring = (applicationId) => {
  scoreApplication(applicationId).catch((err) =>
    console.error(`Unexpected error scoring application ${applicationId}:`, err.message)
  );
};

const rescoreApplications = async (filter) => {
  const applications = await Application.find(filter).select('_id');
  await Application.updateMany(filter, { scoringStatus: 'pending' });
  applications.forEach((app) => scheduleScoring(app._id));
};

const rescoreApplicationsForJob = (jobId) => rescoreApplications({ job: jobId });
const rescoreApplicationsForCandidate = (candidateId) => rescoreApplications({ candidate: candidateId });

module.exports = { scheduleScoring, rescoreApplicationsForJob, rescoreApplicationsForCandidate };
