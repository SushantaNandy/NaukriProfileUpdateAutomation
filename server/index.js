require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

/* Initialize database (creates schema if not exists) */
require('./db/database');

/* Import Routes */
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const boostRoutes = require('./routes/boost');
const scheduleRoutes = require('./routes/schedule');
const naukriRoutes = require('./routes/naukri');

const app = express();
const PORT = process.env.PORT || 3001;

/* Middleware */
app.use(cors());
app.use(express.json());

/* Static file serving for uploads (useful for verifying, though usually we don't serve resumes publicly) */
/* We won't expose resumes statically for security, but we keep the directory structure intact. */

/* Mount Routes */
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/boost', boostRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/naukri', naukriRoutes);

/* Basic Health Check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* Global Error Handler */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

/* Start Server */
const schedulerService = require('./services/schedulerService');

app.listen(PORT, () => {
  console.log(`🚀 NaukriBoost API running on http://localhost:${PORT}`);
  schedulerService.start();
});
