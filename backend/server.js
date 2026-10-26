require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Crucial for Vercel Serverless: ensure DB connection is ready for all requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('DB Connection middleware error:', err);
        return res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

// Basic Route
app.get('/', (req, res) => {
    res.send('AttendAI API is running...');
});

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const classRoutes = require('./src/routes/classRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', classRoutes);
app.use('/api/attendance', attendanceRoutes);

const PORT = process.env.PORT || 5000;

// Connect and listen if running as a standalone node server
if (require.main === module || !process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }).catch(err => {
        console.error('Server failed to start:', err);
    });
}

module.exports = app;
