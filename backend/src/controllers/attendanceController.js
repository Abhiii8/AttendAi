const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');
const crypto = require('crypto');

// Utility: Haversine Formula for distance in meters
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the earth in m
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
};

// Utility: Euclidean Distance for Face Recognition (128d vector)
const calculateEuclideanDistance = (desc1, desc2) => {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
};

// @desc    Start an attendance session (generates token)
// @route   POST /api/attendance/start
// @access  Private/Faculty
const startSession = async (req, res) => {
    const { classId, attendanceCode, lat, lng, radius } = req.body;
    try {
        if (!attendanceCode || lat === undefined || lng === undefined) {
            return res.status(400).json({ message: 'Code and Location data are required to start a session.' });
        }

        // Invalidate any previous active sessions for this class to prevent zombies
        await Attendance.updateMany(
            { class: classId, isActive: true },
            { $set: { isActive: false } }
        );

        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        const session = await Attendance.create({
            class: classId,
            faculty: req.user._id,
            sessionToken,
            attendanceCode,
            location: { lat, lng },
            radius: radius || 100,
            isActive: true,
            records: []
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Mark attendance (Student verification)
// @route   POST /api/attendance/mark
// @access  Private/Student
const markAttendance = async (req, res) => {
    const { sessionToken, attendanceCode, lat, lng, faceDescriptor } = req.body;
    try {
        const session = await Attendance.findOne({ sessionToken, isActive: true });

        if (!session) {
            return res.status(404).json({ message: 'Session is invalid, expired, or has been closed by the instructor.' });
        }

        // 1. Verify Secret Code
        if (session.attendanceCode !== attendanceCode) {
            return res.status(401).json({ message: 'Incorrect attendance code provided.' });
        }

        // 2. Geofence Verification
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ message: 'Location data is required.' });
        }
        const distance = getDistanceFromLatLonInMeters(lat, lng, session.location.lat, session.location.lng);
        if (distance > session.radius) {
            return res.status(403).json({ message: `You are too far away (${Math.round(distance)}m). You must be within ${session.radius}m of the classroom.` });
        }

        // 3. Facial Verification
        if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
            return res.status(400).json({ message: 'Face descriptor is required.' });
        }
        
        const student = await User.findById(req.user._id);
        if (!student.faceEmbeddings || student.faceEmbeddings.length === 0) {
            return res.status(403).json({ message: 'Face ID not set up. Please set up your Face ID in your profile first.' });
        }

        // Threshold of 0.6 is industry standard for face-api.js euclidean distance match
        const faceDistance = calculateEuclideanDistance(faceDescriptor, student.faceEmbeddings);
        if (faceDistance > 0.6) {
            return res.status(403).json({ message: `Face verification failed (Distance: ${faceDistance.toFixed(2)}). Proxy detected!` });
        }

        // 4. Mark if everything passes (Check if already marked today for this class)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            class: session.class,
            date: { $gte: startOfDay, $lte: endOfDay },
            'records.student': req.user._id
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'You have already marked your attendance for this class today.' });
        }

        session.records.push({
            student: req.user._id,
            status: 'Present',
            markedAt: Date.now()
        });

        await session.save();

        // 5. Auto-enroll student in the class if they aren't already
        const classDoc = await Class.findById(session.class);
        if (classDoc && !classDoc.students.includes(req.user._id)) {
            classDoc.students.push(req.user._id);
            await classDoc.save();
        }

        res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get active session for a specific class (for Direct Marking)
// @route   GET /api/attendance/active-session/:classId
// @access  Private
const getActiveSession = async (req, res) => {
    try {
        const session = await Attendance.findOne({ 
            class: req.params.classId, 
            isActive: true 
        }).sort({ createdAt: -1 });

        if (!session) {
            return res.status(404).json({ message: 'No active session found for this class.' });
        }

        res.status(200).json({ sessionToken: session.sessionToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get attendance records/history
// @route   GET /api/attendance
// @access  Private
const getAttendanceRecords = async (req, res) => {
    try {
        let sessions = [];

        if (req.user.role === 'admin') {
            sessions = await Attendance.find()
                .populate({ path: 'class', populate: { path: 'subject' } })
                .populate('faculty', 'name')
                .populate('records.student', 'name idNumber')
                .sort({ date: -1 });
        } else if (req.user.role === 'faculty') {
            sessions = await Attendance.find({ faculty: req.user._id })
                .populate({ path: 'class', populate: { path: 'subject' } })
                .populate('records.student', 'name idNumber')
                .sort({ date: -1 });
        } else if (req.user.role === 'student') {
            // Find all classes the student is in
            const classes = await Class.find({ students: req.user._id });
            const classIds = classes.map(c => c._id);
            
            // Find all attendance sessions for those classes, OR where they have a record
            const rawSessions = await Attendance.find({ 
                $or: [
                    { class: { $in: classIds } },
                    { 'records.student': req.user._id }
                ]
            })
                .populate({ path: 'class', populate: { path: 'subject' } })
                .populate('faculty', 'name')
                .sort({ date: -1 });
            
            // Map to add "status" for this specific student
            sessions = rawSessions.map(session => {
                const sessionObj = session.toObject();
                const record = sessionObj.records.find(r => r.student.toString() === req.user._id.toString());
                sessionObj.studentStatus = record ? record.status : 'Absent';
                // Remove other students' records for privacy
                delete sessionObj.records; 
                return sessionObj;
            });
        }

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard stats for student
// @route   GET /api/attendance/student-stats
// @access  Private/Student
const getStudentStats = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Ensure we catch classes they are officially in, AND ones they have attended (failsafe)
        const attendedSessions = await Attendance.find({ 'records.student': studentId }).distinct('class');
        const classes = await Class.find({ 
            $or: [
                { students: studentId },
                { _id: { $in: attendedSessions } }
            ]
        }).populate('subject');
        
        const classIds = classes.map(c => c._id);
        const totalClasses = classes.length;

        // 2. Attendance Percentage
        const totalSessions = await Attendance.find({ class: { $in: classIds } });
        
        let presentCount = 0;
        let validSessionsCount = 0; // sessions that have happened

        totalSessions.forEach(session => {
            validSessionsCount++;
            const record = session.records.find(r => r.student.toString() === studentId.toString());
            if (record && record.status === 'Present') {
                presentCount++;
            }
        });

        const attendancePercentage = validSessionsCount > 0 
            ? Math.round((presentCount / validSessionsCount) * 100) 
            : 0;

        // 3. Upcoming Lectures for Today
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayStr = dayNames[new Date().getDay()];
        let todayLectures = [];

        // To determine if already marked, we need to check attendance for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all attendance sessions for today where this student is present
        const todaysAttendances = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            'records.student': studentId,
            'records.status': 'Present'
        });

        // Create a Set of class IDs where the student is marked present today
        const markedClassIds = new Set(todaysAttendances.map(a => a.class.toString()));

        classes.forEach(cls => {
            if (cls.schedule) {
                cls.schedule.forEach(slot => {
                    if (slot.dayOfWeek === todayStr) {
                        todayLectures.push({
                            className: cls.name,
                            subjectName: cls.subject?.name || 'Unknown Subject',
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            room: slot.room,
                            type: slot.type,
                            isMarked: markedClassIds.has(cls._id.toString())
                        });
                    }
                });
            }
        });

        // Sort lectures by start time
        todayLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));

        res.status(200).json({
            totalClasses,
            attendancePercentage,
            todayLectures
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    startSession,
    markAttendance,
    getActiveSession,
    getAttendanceRecords,
    getStudentStats
};
