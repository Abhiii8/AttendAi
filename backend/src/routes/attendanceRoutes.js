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
router.get('/student-stats', protect, authorize('student'), getStudentStats);
router.post('/start', protect, authorize('faculty'), startSession);
router.post('/stop/:id', protect, authorize('faculty', 'admin'), stopSession);
router.get('/session/:id', protect, getSessionSummary);
router.post('/mark', protect, authorize('student'), markAttendance);
router.get('/active-session/:classId', protect, authorize('student'), getActiveSession);

module.exports = router;

