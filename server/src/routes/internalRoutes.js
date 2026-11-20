const express = require('express');
const router = express.Router();
const { requireInternalKey } = require('../middleware/internalAuth');
const { getFullCorpus } = require('../utils/corpus');

// Lets ml-service pull the full job corpus itself (e.g. after it restarts with
// an empty index), instead of waiting for the next create/update/delete push.
router.get('/jobs-corpus', requireInternalKey, async (req, res) => {
  try {
    const jobs = await getFullCorpus();
    res.status(200).json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to build jobs corpus' });
  }
});

module.exports = router;
