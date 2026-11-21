

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { rebuildIndex } = require('./services/mlService');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`HireSync server running on port ${PORT}`);
  });

  // Prime the ml-service corpus index on boot; ml-service also pulls it lazily
  // itself, so this is a best-effort head start, not a hard dependency.
  rebuildIndex().catch((err) => console.error('Initial ml-service index rebuild failed:', err.message));
});