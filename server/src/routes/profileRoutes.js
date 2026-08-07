const express = require('express');
const router = express.Router();
const { updateProfile, getProfile, getRecommendedJobs } = require('../controllers/profileController');
const { protect, requireRole } = require('../middleware/auth');


router.get('/', protect, requireRole('candidate'), getProfile);
router.put('/', protect, requireRole('candidate'), updateProfile);
router.get('/recommendations', protect, requireRole('candidate'), getRecommendedJobs);

module.exports = router;