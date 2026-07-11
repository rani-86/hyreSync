const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
} = require('../controllers/applicationController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/:jobId', protect, requireRole('candidate'), applyToJob);
router.get('/my', protect, requireRole('candidate'), getMyApplications);
router.get('/job/:jobId', protect, requireRole('recruiter'), getApplicantsForJob);

module.exports = router;