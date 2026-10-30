const express = require('express');
const { 
    startSession, 
    markAttendance, 
    getActiveSession, 
    getAttendanceRecords, 
    getStudentStats,
    stopSession,
    getSessionSummary,
    getStudentAttendanceReport,
    getCourseAttendanceReport,
    getFacultyAttendanceReport
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAttendanceRecords);
router.get('/student-report', protect, getStudentAttendanceReport);
router.get('/course-report', protect, getCourseAttendanceReport);
router.get('/faculty-report', protect, getFacultyAttendanceReport);

// Direct report helper endpoints accessible to all authenticated users
router.get('/courses', protect, async (req, res) => {
    try {
        const Course = require('../models/Course');
        const courses = await Course.find().populate('department', 'name code').sort({ name: 1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/faculty-list', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const faculty = await User.find({ role: 'faculty' })
            .select('name email idNumber department course assignedSubjects')
            .populate('department', 'name code')
            .populate('course', 'name code')
            .sort({ name: 1 });
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/student-stats', protect, authorize('student'), getStudentStats);
router.post('/start', protect, authorize('faculty'), startSession);
router.post('/stop/:id', protect, authorize('faculty', 'admin'), stopSession);
router.get('/session/:id', protect, getSessionSummary);
router.post('/mark', protect, authorize('student'), markAttendance);
router.get('/active-session/:classId', protect, authorize('student'), getActiveSession);

module.exports = router;

