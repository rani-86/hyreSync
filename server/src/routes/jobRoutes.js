const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { protect, requireRole } = require('../middleware/auth');

// Public routes — anyone can browse jobs
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes — recruiter only
router.post('/', protect, requireRole('recruiter'), createJob);
router.put('/:id', protect, requireRole('recruiter'), updateJob);
router.delete('/:id', protect, requireRole('recruiter'), deleteJob);

module.exports = router;