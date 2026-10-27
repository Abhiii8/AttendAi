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

const path = require('path');
const publicPath = path.join(__dirname, 'public');

// Serve static frontend assets
app.use(express.static(publicPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AttendAI API is running...' });
});

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const classRoutes = require('./src/routes/classRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', classRoutes);
app.use('/api/attendance', attendanceRoutes);

// SPA fallback: send index.html for all GET requests that didn't match an API route
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(publicPath, 'index.html'));
    }
    next();
});

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
