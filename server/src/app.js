const express = require('express');

const app = express();

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hiresync-server' });
});

app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
module.exports = app;