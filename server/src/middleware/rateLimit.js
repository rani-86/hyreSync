const rateLimit = require('express-rate-limit');

// Applied to auth endpoints that are natural brute-force/enumeration/spam
// targets: login, signup, forgot-password, resend-verification.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

module.exports = { authLimiter };
