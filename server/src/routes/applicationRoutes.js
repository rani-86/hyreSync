const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  getApplicantsWithFitScores,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/:jobId', protect, requireRole('candidate'), applyToJob);
router.get('/my', protect, requireRole('candidate'), getMyApplications);
router.get('/job/:jobId', protect, requireRole('recruiter'), getApplicantsForJob);
router.get('/job/:jobId/fit-scores', protect, requireRole('recruiter'), getApplicantsWithFitScores);
router.patch('/:applicationId/status', protect, requireRole('recruiter'), updateApplicationStatus);

module.exports = router;