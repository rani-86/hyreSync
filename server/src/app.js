const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hiresync-server' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/internal', require('./routes/internalRoutes'));
module.exports = app;