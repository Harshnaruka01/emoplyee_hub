const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded employee photos statically
const uploadsPath = process.env.VERCEL
  ? '/tmp'
  : path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Base route diagnostics
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err.message || err);
  
  // Custom check for multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size too large. Maximum limit is 5MB.' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error.'
  });
});

module.exports = app;
