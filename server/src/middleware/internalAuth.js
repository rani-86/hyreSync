// Guards server->ml-service internal routes, keyed by the same shared secret
// the server sends to ml-service (ML_INTERNAL_KEY).
const requireInternalKey = (req, res, next) => {
  const expected = process.env.ML_INTERNAL_KEY;
  if (expected && req.headers['x-internal-key'] !== expected) {
    return res.status(401).json({ message: 'Invalid or missing internal key' });
  }
  next();
};

module.exports = { requireInternalKey };
