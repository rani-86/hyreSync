const axios = require('axios');
const { getFullCorpus } = require('../utils/corpus');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 15000,
  headers: process.env.ML_INTERNAL_KEY ? { 'x-internal-key': process.env.ML_INTERNAL_KEY } : {},
});

const rebuildIndex = async () => {
  const jobs = await getFullCorpus();
  return mlClient.post('/index/rebuild', { jobs });
};

const getFitScore = ({ resumeUrl, jobDescription, jobId }) =>
  mlClient.post('/fit-score', { resume_url: resumeUrl, job_description: jobDescription, job_id: jobId });

const getRecommendScore = ({ profileText, jobDescription, jobId }) =>
  mlClient.post('/recommend-score', { profile_text: profileText, job_description: jobDescription, job_id: jobId });

module.exports = { rebuildIndex, getFitScore, getRecommendScore };
