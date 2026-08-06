const express = require('express');
const router = express.Router();
const { updateProfile, getProfile } = require('../controllers/profileController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', protect, requireRole('candidate'), getProfile);
router.put('/', protect, requireRole('candidate'), updateProfile);

module.exports = router;