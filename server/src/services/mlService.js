const axios = require('axios');
const { getFullCorpus } = require('../utils/corpus');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 15000,
  headers: process.env.ML_INTERNAL_KEY ? { 'x-internal-key': process.env.ML_INTERNAL_KEY } : {},
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries idempotent ml-service calls on timeout/network/5xx errors only —
// never on 4xx, since retrying a bad request just wastes the Groq/embedding quota.
const withRetry = async (fn) => {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      const retriable = !status || status >= 500;
      if (!retriable || attempt === MAX_RETRIES) break;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw lastErr;
};

const rebuildIndex = async () => {
  const jobs = await getFullCorpus();
  return withRetry(() => mlClient.post('/index/rebuild', { jobs }));
};

const extractResumeText = ({ resumeUrl }) =>
  withRetry(() => mlClient.post('/extract-resume-text', { resume_url: resumeUrl }));

const getEmbedding = ({ text }) => withRetry(() => mlClient.post('/embed', { text }));

const getFitScore = ({
  resumeUrl,
  resumeText,
  resumeEmbedding,
  jobDescription,
  jobId,
  jobEmbedding,
  jobSkills,
  candidateSkills,
}) =>
  withRetry(() =>
    mlClient.post('/fit-score', {
      resume_url: resumeUrl,
      resume_text: resumeText,
      resume_embedding: resumeEmbedding,
      job_description: jobDescription,
      job_id: jobId,
      job_embedding: jobEmbedding,
      job_skills: jobSkills,
      candidate_skills: candidateSkills,
    })
  );

const getRecommendations = ({ profileText, resumeText, resumeEmbedding, candidateSkills, jobs, topK }) =>
  withRetry(() =>
    mlClient.post('/recommend', {
      profile_text: profileText,
      resume_text: resumeText,
      resume_embedding: resumeEmbedding,
      candidate_skills: candidateSkills,
      jobs,
      top_k: topK,
    })
  );

module.exports = { rebuildIndex, extractResumeText, getEmbedding, getFitScore, getRecommendations };
