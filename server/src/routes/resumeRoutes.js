const express = require('express');
const router = express.Router();
const { uploadResume } = require('../controllers/resumeController');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/upload', protect, requireRole('candidate'), upload.single('resume'), uploadResume);

module.exports = router;