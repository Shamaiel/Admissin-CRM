const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/institutions',require('./routes/institutions'));
app.use('/api/campuses',    require('./routes/campuses'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/programs',    require('./routes/programs'));
app.use('/api/academic-years', require('./routes/academicYears'));
app.use('/api/seat-matrix', require('./routes/seatMatrix'));
app.use('/api/applicants',  require('./routes/applicants'));
app.use('/api/admissions',  require('./routes/admissions'));
app.use('/api/dashboard',   require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Admission CRM API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


