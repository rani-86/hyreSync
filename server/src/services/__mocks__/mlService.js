module.exports = {
  rebuildIndex: jest.fn().mockResolvedValue({ data: { status: 'ok', jobs_indexed: 0 } }),
  extractResumeText: jest.fn().mockResolvedValue({ data: { text: '' } }),
  getEmbedding: jest.fn().mockResolvedValue({ data: { embedding: null, method: 'unavailable' } }),
  getFitScore: jest.fn().mockResolvedValue({
    data: {
      fit_score: 42,
      explanation: { summary: 'ok', matched_skills: [], missing_skills: [], recommendation: 'possible_fit' },
      scoring_method: 'hybrid(lexical)',
      breakdown: { lexical: 42 },
    },
  }),
  getRecommendations: jest.fn().mockResolvedValue({ data: { results: [] } }),
};
