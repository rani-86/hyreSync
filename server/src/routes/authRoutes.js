const express = require('express');
const router = express.Router();
const { signup, login, verifyEmail, resendVerification, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;