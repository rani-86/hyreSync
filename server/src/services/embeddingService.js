const { getEmbedding } = require('./mlService');
const { buildJobCorpusText } = require('../utils/corpus');

// Fire-and-forget: embeddings are a "nice to have" signal in hybrid scoring,
// never required for the app to work (ml-service falls back to lexical+skills
// when GEMINI_API_KEY is missing or the call fails).
const embedJob = async (job) => {
  try {
    const res = await getEmbedding({ text: buildJobCorpusText(job) });
    job.embedding = res.data.embedding || [];
    await job.save();
  } catch (err) {
    console.error(`Failed to embed job ${job._id}:`, err.message);
  }
};

const embedResume = async (user) => {
  if (!user.resumeText) return;
  try {
    const res = await getEmbedding({ text: user.resumeText });
    user.resumeEmbedding = res.data.embedding || [];
    await user.save();
  } catch (err) {
    console.error(`Failed to embed resume for user ${user._id}:`, err.message);
  }
};

module.exports = { embedJob, embedResume };
