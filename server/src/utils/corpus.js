const Job = require('../models/Jobs');

// Text representation of a job used to fit the ml-service's corpus TF-IDF index.
const buildJobCorpusText = (job) => {
  const skills = (job.skillsRequired || []).join(' ');
  return `${job.title} ${job.description} ${skills}`.trim();
};

const getFullCorpus = async () => {
  const jobs = await Job.find().select('title description skillsRequired');
  return jobs.map((job) => ({
    id: job._id.toString(),
    text: buildJobCorpusText(job),
  }));
};

module.exports = { buildJobCorpusText, getFullCorpus };
