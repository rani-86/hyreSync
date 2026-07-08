const express = require('express');

const app = express();

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hiresync-server' });
});

module.exports = app;