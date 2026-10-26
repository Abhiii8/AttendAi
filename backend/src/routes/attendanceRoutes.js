const express = require('express');
const { startSession, markAttendance, getActiveSession, getAttendanceRecords, getStudentStats } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAttendanceRecords);
router.get('/student-stats', protect, authorize('student'), getStudentStats);
router.post('/start', protect, authorize('faculty'), startSession);
router.post('/mark', protect, authorize('student'), markAttendance);
router.get('/active-session/:classId', protect, authorize('student'), getActiveSession);

module.exports = router;
