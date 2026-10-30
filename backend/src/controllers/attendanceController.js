const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
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
    const { sessionToken, attendanceCode, lat, lng, accuracy, faceDescriptor } = req.body;
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

        // Tolerant Euclidean distance threshold for mobile/low-light/low-quality cameras (up to 0.68)
        const faceDistance = calculateEuclideanDistance(faceDescriptor, student.faceEmbeddings);
        if (faceDistance > 0.68) {
            return res.status(403).json({ 
                message: `Face verification failed (Match Distance: ${faceDistance.toFixed(2)}). Please face the camera directly in better lighting.`,
                faceDistance: Math.round(faceDistance * 100) / 100
            });
        }

        // Calculate confidence percentage and match quality
        const confidenceScore = Math.max(72, Math.min(99, Math.round((1 - (faceDistance / 0.85)) * 100)));
        const matchQuality = faceDistance < 0.45 ? 'Perfect Match' : faceDistance < 0.58 ? 'High Confidence Match' : 'Verified Match';

        const formattedDistance = Math.round(distance * 10) / 10;
        const formattedAccuracy = accuracy ? Math.round(accuracy * 10) / 10 : null;
        const formattedFaceDistance = Math.round(faceDistance * 100) / 100;

        // 4. Check if student is ALREADY marked in this active session
        const existingRecordIndex = session.records.findIndex(
            r => r.student && (r.student._id ? r.student._id.toString() : r.student.toString()) === req.user._id.toString()
        );

        if (existingRecordIndex !== -1) {
            // Student already marked in THIS active session: update with latest accurate coordinates and return success (not 400 error!)
            session.records[existingRecordIndex].status = 'Present';
            session.records[existingRecordIndex].distance = formattedDistance;
            session.records[existingRecordIndex].accuracy = formattedAccuracy;
            session.records[existingRecordIndex].faceDistance = formattedFaceDistance;
            session.records[existingRecordIndex].deviceLocation = { lat, lng };
            if (!session.records[existingRecordIndex].markedAt) {
                session.records[existingRecordIndex].markedAt = Date.now();
            }
            await session.save();

            return res.status(200).json({
                message: 'Attendance verified! You are marked Present for this session.',
                alreadyMarked: true,
                distance: formattedDistance,
                accuracy: formattedAccuracy,
                faceDistance: formattedFaceDistance,
                confidence: confidenceScore,
                matchQuality
            });
        }

        // Add attendance record to session
        session.records.push({
            student: req.user._id,
            status: 'Present',
            distance: formattedDistance,
            accuracy: formattedAccuracy,
            faceDistance: formattedFaceDistance,
            deviceLocation: { lat, lng },
            markedAt: Date.now()
        });

        await session.save();

        // 5. Auto-enroll student in the class if they aren't already
        const classDoc = await Class.findById(session.class);
        if (classDoc && !classDoc.students.some(s => s.toString() === req.user._id.toString())) {
            classDoc.students.push(req.user._id);
            await classDoc.save();
        }

        res.status(200).json({ 
            message: 'Attendance marked successfully',
            alreadyMarked: false,
            distance: formattedDistance,
            accuracy: formattedAccuracy,
            faceDistance: formattedFaceDistance,
            confidence: confidenceScore,
            matchQuality
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Helper: Compile detailed session attendance report with distances & roster
const buildSessionReport = async (session) => {
    // Collect all student IDs involved in this class and records
    const recordStudentIds = session.records.map(r => r.student?._id || r.student).filter(Boolean);
    const enrolledIds = (session.class?.students || []).map(s => s?._id || s).filter(Boolean);

    const allStudentIds = [...new Set([
        ...recordStudentIds.map(id => id.toString()),
        ...enrolledIds.map(id => id.toString())
    ])];

    // Fetch user details for all students to guarantee complete profile data
    const userDocs = await User.find({ _id: { $in: allStudentIds } }).select('name email idNumber department course year');
    const userMap = new Map();
    userDocs.forEach(u => userMap.set(u._id.toString(), u));

    // Map records by student ID string
    const markedMap = new Map();
    session.records.forEach(rec => {
        const sid = rec.student?._id ? rec.student._id.toString() : (rec.student ? rec.student.toString() : null);
        if (sid) {
            markedMap.set(sid, rec);
        }
    });

    const studentReport = [];
    const processedStudentIds = new Set();

    // 1. Process enrolled students
    for (const enrolled of (session.class?.students || [])) {
        const sid = enrolled?._id ? enrolled._id.toString() : (enrolled ? enrolled.toString() : null);
        if (!sid) continue;

        processedStudentIds.add(sid);
        const userObj = userMap.get(sid) || (typeof enrolled === 'object' ? enrolled : {});
        const record = markedMap.get(sid);

        if (record && record.status === 'Present') {
            studentReport.push({
                studentId: sid,
                name: userObj.name || 'Student',
                idNumber: userObj.idNumber || 'N/A',
                email: userObj.email || '',
                status: 'Present',
                distance: record.distance !== undefined ? record.distance : null,
                accuracy: record.accuracy !== undefined ? record.accuracy : null,
                faceDistance: record.faceDistance !== undefined ? record.faceDistance : null,
                markedAt: record.markedAt
            });
        } else {
            studentReport.push({
                studentId: sid,
                name: userObj.name || 'Student',
                idNumber: userObj.idNumber || 'N/A',
                email: userObj.email || '',
                status: 'Absent',
                distance: null,
                accuracy: null,
                faceDistance: null,
                markedAt: null
            });
        }
    }

    // 2. Include any students who marked attendance in this session but weren't pre-enrolled
    for (const rec of session.records) {
        const sid = rec.student?._id ? rec.student._id.toString() : (rec.student ? rec.student.toString() : null);
        if (sid && !processedStudentIds.has(sid)) {
            processedStudentIds.add(sid);
            const userObj = userMap.get(sid) || (typeof rec.student === 'object' ? rec.student : {});
            studentReport.push({
                studentId: sid,
                name: userObj.name || 'Student',
                idNumber: userObj.idNumber || 'N/A',
                email: userObj.email || '',
                status: rec.status || 'Present',
                distance: rec.distance !== undefined ? rec.distance : null,
                accuracy: rec.accuracy !== undefined ? rec.accuracy : null,
                faceDistance: rec.faceDistance !== undefined ? rec.faceDistance : null,
                markedAt: rec.markedAt
            });
        }
    }

    // Sort: Present first (sorted by distance ascending), then Absent (alphabetical)
    studentReport.sort((a, b) => {
        if (a.status === 'Present' && b.status !== 'Present') return -1;
        if (a.status !== 'Present' && b.status === 'Present') return 1;
        if (a.status === 'Present' && b.status === 'Present') {
            return (a.distance || 0) - (b.distance || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
    });

    const presentCount = studentReport.filter(s => s.status === 'Present').length;
    const absentCount = studentReport.filter(s => s.status === 'Absent').length;
    const totalStudents = studentReport.length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    const presentDistances = studentReport
        .filter(s => s.status === 'Present' && s.distance !== null)
        .map(s => s.distance);
    const avgDistance = presentDistances.length > 0
        ? Math.round((presentDistances.reduce((a, b) => a + b, 0) / presentDistances.length) * 10) / 10
        : 0;

    return {
        sessionId: session._id,
        className: session.class?.name || 'Class',
        subjectName: session.class?.subject?.name || 'Subject',
        date: session.date,
        attendanceCode: session.attendanceCode,
        radius: session.radius,
        location: session.location,
        isActive: session.isActive,
        totalStudents,
        presentCount,
        absentCount,
        attendanceRate,
        avgDistance,
        students: studentReport
    };
};

// @desc    End/Terminate an attendance session and get complete session report
// @route   POST /api/attendance/stop/:id
// @access  Private/Faculty
const stopSession = async (req, res) => {
    try {
        const session = await Attendance.findById(req.params.id)
            .populate({ 
                path: 'class', 
                populate: [
                    { path: 'subject' },
                    { path: 'students', select: 'name email idNumber department course year' }
                ] 
            })
            .populate('records.student', 'name email idNumber department course year');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Close session
        session.isActive = false;
        await session.save();

        const report = await buildSessionReport(session);
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get session summary report by ID
// @route   GET /api/attendance/session/:id
// @access  Private
const getSessionSummary = async (req, res) => {
    try {
        const session = await Attendance.findById(req.params.id)
            .populate({ 
                path: 'class', 
                populate: [
                    { path: 'subject' },
                    { path: 'students', select: 'name email idNumber department course year' }
                ] 
            })
            .populate('records.student', 'name email idNumber department course year');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const report = await buildSessionReport(session);
        res.status(200).json(report);
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

// @desc    Get detailed student attendance report (Daily, Weekly, Monthly, or Custom range) with PDF export readiness
// @route   GET /api/attendance/student-report
// @access  Private
const getStudentAttendanceReport = async (req, res) => {
    try {
        let targetStudentId = req.query.studentId;

        // Security: Students can only view their own attendance reports
        if (req.user.role === 'student') {
            targetStudentId = req.user._id.toString();
        }

        const timeframe = req.query.timeframe || 'monthly';
        let start, end;

        if (timeframe === 'daily') {
            const base = req.query.date ? new Date(req.query.date) : new Date();
            start = new Date(base);
            start.setHours(0, 0, 0, 0);
            end = new Date(base);
            end.setHours(23, 59, 59, 999);
        } else if (timeframe === 'weekly') {
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date(end);
            start.setDate(end.getDate() - 7);
            start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'monthly') {
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date(end);
            start.setDate(end.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'custom') {
            start = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
            start.setHours(0, 0, 0, 0);
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
        } else {
            // 'all'
            start = new Date(0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        // Case 1: Specific Student Report Requested
        if (targetStudentId) {
            const student = await User.findById(targetStudentId)
                .select('name email idNumber course department year')
                .populate('course', 'name code')
                .populate('department', 'name code');

            if (!student) {
                return res.status(404).json({ message: 'Student profile not found.' });
            }

            // Find all classes student is enrolled in or attended
            const studentClasses = await Class.find({ students: student._id }).select('_id name');
            const attendedClassIds = await Attendance.find({
                'records.student': student._id,
                date: { $gte: start, $lte: end }
            }).distinct('class');

            const allRelevantClassIds = [...new Set([
                ...studentClasses.map(c => c._id.toString()),
                ...attendedClassIds.map(id => id.toString())
            ])];

            const sessions = await Attendance.find({
                class: { $in: allRelevantClassIds },
                date: { $gte: start, $lte: end }
            })
                .populate({
                    path: 'class',
                    populate: [
                        { path: 'subject', select: 'name code credits' },
                        { path: 'course', select: 'name code' }
                    ]
                })
                .populate('faculty', 'name email idNumber')
                .sort({ date: -1 });

            let totalClasses = 0;
            let attendedClasses = 0;
            let absentClasses = 0;
            const subjectMap = {};
            const sessionLogs = [];

            sessions.forEach(session => {
                const isEnrolled = session.class?.students 
                    ? session.class.students.some(s => (s._id || s).toString() === student._id.toString())
                    : true;
                
                const record = session.records.find(r => {
                    const rSid = r.student?._id ? r.student._id.toString() : (r.student ? r.student.toString() : null);
                    return rSid === student._id.toString();
                });

                if (!isEnrolled && !record) return;

                totalClasses++;
                const isPresent = record && record.status === 'Present';
                if (isPresent) {
                    attendedClasses++;
                } else {
                    absentClasses++;
                }

                const subjId = session.class?.subject?._id?.toString() || 'general';
                const subjName = session.class?.subject?.name || 'General Subject';
                const subjCode = session.class?.subject?.code || 'GEN';
                const facultyName = session.faculty?.name || 'Faculty Instructor';

                if (!subjectMap[subjId]) {
                    subjectMap[subjId] = {
                        subjectId: subjId,
                        name: subjName,
                        code: subjCode,
                        facultyName,
                        total: 0,
                        attended: 0,
                        absent: 0,
                        percentage: 0
                    };
                }

                subjectMap[subjId].total++;
                if (isPresent) {
                    subjectMap[subjId].attended++;
                } else {
                    subjectMap[subjId].absent++;
                }

                const faceDist = record?.faceDistance !== undefined && record.faceDistance !== null ? record.faceDistance : null;
                let matchQuality = null;
                if (faceDist !== null) {
                    matchQuality = faceDist < 0.45 ? 'Perfect Match' : faceDist < 0.58 ? 'High Confidence' : 'Verified';
                }

                sessionLogs.push({
                    sessionId: session._id,
                    date: session.date,
                    className: session.class?.name || 'Class',
                    subjectName: subjName,
                    subjectCode: subjCode,
                    facultyName,
                    status: isPresent ? 'Present' : 'Absent',
                    distance: record?.distance !== undefined && record.distance !== null ? record.distance : null,
                    faceDistance: faceDist,
                    matchQuality,
                    markedAt: record?.markedAt || null
                });
            });

            const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 1000) / 10 : 0;

            Object.values(subjectMap).forEach(subj => {
                subj.percentage = subj.total > 0 ? Math.round((subj.attended / subj.total) * 1000) / 10 : 0;
            });

            const eligibility = overallPercentage >= 75 ? 'Eligible' : overallPercentage >= 65 ? 'Warning' : 'Critical Shortage';

            return res.json({
                student: {
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    idNumber: student.idNumber || 'N/A',
                    course: student.course?.name || 'N/A',
                    courseCode: student.course?.code || 'N/A',
                    department: student.department?.name || 'N/A',
                    year: student.year || 'N/A'
                },
                timeframe,
                dateRange: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                summary: {
                    totalClasses,
                    attended: attendedClasses,
                    absent: absentClasses,
                    percentage: overallPercentage,
                    eligibility
                },
                subjects: Object.values(subjectMap),
                sessionLogs
            });
        }

        // Case 2: Roster Summary for Admin / Faculty (No single studentId specified)
        const studentFilter = { role: 'student' };
        if (req.query.courseId) studentFilter.course = req.query.courseId;
        if (req.query.departmentId) studentFilter.department = req.query.departmentId;

        const students = await User.find(studentFilter)
            .select('name email idNumber course department year')
            .populate('course', 'name code')
            .populate('department', 'name code')
            .sort({ name: 1 });

        const sessions = await Attendance.find({ date: { $gte: start, $lte: end } })
            .populate({ path: 'class', select: 'students name subject' });

        const rosterSummary = students.map(st => {
            const sid = st._id.toString();
            let total = 0;
            let attended = 0;

            sessions.forEach(sess => {
                const isEnrolled = sess.class?.students?.some(s => (s._id || s).toString() === sid);
                const rec = sess.records.find(r => (r.student?._id || r.student)?.toString() === sid);
                if (!isEnrolled && !rec) return;

                total++;
                if (rec && rec.status === 'Present') {
                    attended++;
                }
            });

            const absent = total - attended;
            const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

            return {
                student: {
                    _id: st._id,
                    name: st.name,
                    email: st.email,
                    idNumber: st.idNumber || 'N/A',
                    course: st.course?.name || 'N/A',
                    courseCode: st.course?.code || 'N/A',
                    department: st.department?.name || 'N/A',
                    year: st.year || 'N/A'
                },
                totalClasses: total,
                attended,
                absent,
                percentage,
                eligibility: percentage >= 75 ? 'Eligible' : percentage >= 65 ? 'Warning' : 'Critical Shortage'
            };
        });

        res.json({
            timeframe,
            dateRange: { start: start.toISOString(), end: end.toISOString() },
            students: rosterSummary
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get complete course-wide attendance report & analytics (IMSCIT, BCA, MCA)
// @route   GET /api/attendance/course-report
// @access  Private
const getCourseAttendanceReport = async (req, res) => {
    try {
        let courseId = req.query.courseId;
        if (!courseId) {
            const firstCourse = await Course.findOne();
            if (!firstCourse) {
                return res.status(404).json({ message: 'No courses found in system.' });
            }
            courseId = firstCourse._id.toString();
        }

        const course = await Course.findById(courseId).populate('department', 'name code');
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const timeframe = req.query.timeframe || 'all';
        let start, end;
        if (timeframe === 'daily') {
            const base = req.query.date ? new Date(req.query.date) : new Date();
            start = new Date(base); start.setHours(0, 0, 0, 0);
            end = new Date(base); end.setHours(23, 59, 59, 999);
        } else if (timeframe === 'weekly') {
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date(end); start.setDate(end.getDate() - 7); start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'monthly') {
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date(end); start.setDate(end.getDate() - 30); start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'custom') {
            start = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
            start.setHours(0, 0, 0, 0);
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
        } else {
            start = new Date(0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        // 1. Fetch all students in this course
        const students = await User.find({ role: 'student', course: course._id })
            .select('name email idNumber year')
            .sort({ idNumber: 1 });

        // 2. Fetch all classes in this course
        const classes = await Class.find({ course: course._id })
            .populate('subject', 'name code credits')
            .populate('faculty', 'name email idNumber');
        const classIds = classes.map(c => c._id);

        // 3. Fetch attendance sessions in this timeframe
        const sessions = await Attendance.find({
            class: { $in: classIds },
            date: { $gte: start, $lte: end }
        })
            .populate({ path: 'class', populate: { path: 'subject' } })
            .populate('faculty', 'name email idNumber')
            .sort({ date: -1 });

        // 4. Calculate Subject Breakdown
        const subjectStatsMap = {};
        classes.forEach(cls => {
            if (cls.subject) {
                const sId = cls.subject._id.toString();
                if (!subjectStatsMap[sId]) {
                    subjectStatsMap[sId] = {
                        subjectId: sId,
                        name: cls.subject.name,
                        code: cls.subject.code,
                        facultyName: cls.faculty?.name || 'Faculty Instructor',
                        totalLectures: 0,
                        totalPresent: 0,
                        totalExpected: 0
                    };
                }
            }
        });

        // 5. Calculate Student Roster stats
        const studentStatsMap = {};
        students.forEach(st => {
            studentStatsMap[st._id.toString()] = {
                student: {
                    _id: st._id,
                    name: st.name,
                    email: st.email,
                    idNumber: st.idNumber,
                    year: st.year || 'FY'
                },
                totalClasses: 0,
                attended: 0,
                absent: 0
            };
        });

        const recentSessionsList = [];

        sessions.forEach(sess => {
            const subj = sess.class?.subject;
            const sId = subj?._id?.toString();
            if (sId && subjectStatsMap[sId]) {
                subjectStatsMap[sId].totalLectures++;
            }

            let sessPresent = 0;
            let sessTotal = 0;

            students.forEach(st => {
                const sidStr = st._id.toString();
                const isEnrolled = sess.class?.students 
                    ? sess.class.students.some(s => (s._id || s).toString() === sidStr)
                    : true;
                const rec = sess.records.find(r => (r.student?._id || r.student)?.toString() === sidStr);

                if (isEnrolled || rec) {
                    sessTotal++;
                    studentStatsMap[sidStr].totalClasses++;
                    if (rec && rec.status === 'Present') {
                        sessPresent++;
                        studentStatsMap[sidStr].attended++;
                        if (sId && subjectStatsMap[sId]) subjectStatsMap[sId].totalPresent++;
                    } else {
                        studentStatsMap[sidStr].absent++;
                    }
                    if (sId && subjectStatsMap[sId]) subjectStatsMap[sId].totalExpected++;
                }
            });

            recentSessionsList.push({
                sessionId: sess._id,
                date: sess.date,
                className: sess.class?.name || 'Class',
                subjectName: subj?.name || 'Subject',
                subjectCode: subj?.code || '',
                facultyName: sess.faculty?.name || 'Faculty',
                presentCount: sessPresent,
                totalStudents: sessTotal,
                attendanceRate: sessTotal > 0 ? Math.round((sessPresent / sessTotal) * 100) : 0,
                radius: sess.radius
            });
        });

        const subjectList = Object.values(subjectStatsMap).map(s => {
            const avgRate = s.totalExpected > 0 ? Math.round((s.totalPresent / s.totalExpected) * 1000) / 10 : 0;
            return {
                subjectId: s.subjectId,
                name: s.name,
                code: s.code,
                facultyName: s.facultyName,
                totalLectures: s.totalLectures,
                attendanceRate: avgRate
            };
        });

        let totalPresentAll = 0;
        let totalExpectedAll = 0;
        let eligibleCount = 0;
        let warningCount = 0;
        let shortageCount = 0;

        const studentRoster = Object.values(studentStatsMap).map(st => {
            const pct = st.totalClasses > 0 ? Math.round((st.attended / st.totalClasses) * 1000) / 10 : 0;
            totalPresentAll += st.attended;
            totalExpectedAll += st.totalClasses;

            let eligibility = 'Eligible';
            if (pct >= 75) {
                eligibleCount++;
                eligibility = 'Eligible';
            } else if (pct >= 65) {
                warningCount++;
                eligibility = 'Warning';
            } else {
                shortageCount++;
                eligibility = 'Critical Shortage';
            }

            return {
                ...st,
                percentage: pct,
                eligibility
            };
        });

        const overallCoursePercentage = totalExpectedAll > 0 
            ? Math.round((totalPresentAll / totalExpectedAll) * 1000) / 10 
            : 0;

        res.json({
            course: {
                _id: course._id,
                name: course.name,
                code: course.code,
                department: course.department?.name || 'FCAIT',
                durationYears: course.durationYears || 3,
                totalSemesters: course.totalSemesters || 6
            },
            timeframe,
            dateRange: { start: start.toISOString(), end: end.toISOString() },
            summary: {
                totalStudents: students.length,
                totalLectures: sessions.length,
                overallPercentage: overallCoursePercentage,
                eligibleCount,
                warningCount,
                shortageCount
            },
            subjects: subjectList,
            students: studentRoster,
            recentSessions: recentSessionsList.slice(0, 15)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get complete faculty teaching performance & attendance report
// @route   GET /api/attendance/faculty-report
// @access  Private
const getFacultyAttendanceReport = async (req, res) => {
    try {
        let facultyId = req.query.facultyId;
        if (!facultyId) {
            if (req.user.role === 'faculty') {
                facultyId = req.user._id.toString();
            } else {
                const firstFaculty = await User.findOne({ role: 'faculty' });
                if (!firstFaculty) {
                    return res.status(404).json({ message: 'No faculty members found.' });
                }
                facultyId = firstFaculty._id.toString();
            }
        }

        const faculty = await User.findById(facultyId)
            .select('-password -faceEmbeddings')
            .populate('department', 'name code')
            .populate('course', 'name code')
            .populate('assignedSubjects', 'name code credits');

        if (!faculty) {
            return res.status(404).json({ message: 'Faculty member not found.' });
        }

        const timeframe = req.query.timeframe || 'all';
        let start, end;
        if (timeframe === 'daily') {
            const base = req.query.date ? new Date(req.query.date) : new Date();
            start = new Date(base); start.setHours(0, 0, 0, 0);
            end = new Date(base); end.setHours(23, 59, 59, 999);
        } else if (timeframe === 'weekly') {
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date(end); start.setDate(end.getDate() - 7); start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'monthly') {
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date(end); start.setDate(end.getDate() - 30); start.setHours(0, 0, 0, 0);
        } else if (timeframe === 'custom') {
            start = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
            start.setHours(0, 0, 0, 0);
            end = req.query.endDate ? new Date(req.query.endDate) : new Date();
            end.setHours(23, 59, 59, 999);
        } else {
            start = new Date(0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        const sessions = await Attendance.find({
            faculty: faculty._id,
            date: { $gte: start, $lte: end }
        })
            .populate({ path: 'class', populate: [{ path: 'subject' }, { path: 'course' }] })
            .sort({ date: -1 });

        const subjectStatsMap = {};
        (faculty.assignedSubjects || []).forEach(subj => {
            const sId = subj._id.toString();
            subjectStatsMap[sId] = {
                subjectId: sId,
                name: subj.name,
                code: subj.code,
                credits: subj.credits,
                totalLectures: 0,
                totalPresent: 0,
                totalExpected: 0
            };
        });

        let totalPresentAll = 0;
        let totalExpectedAll = 0;
        const sessionLogs = [];

        sessions.forEach(sess => {
            const subj = sess.class?.subject;
            const sId = subj?._id?.toString();

            const presentCount = sess.records.filter(r => r.status === 'Present').length;
            const totalCount = sess.records.length;

            totalPresentAll += presentCount;
            totalExpectedAll += totalCount;

            if (sId && subjectStatsMap[sId]) {
                subjectStatsMap[sId].totalLectures++;
                subjectStatsMap[sId].totalPresent += presentCount;
                subjectStatsMap[sId].totalExpected += totalCount;
            } else if (subj) {
                if (!subjectStatsMap[sId]) {
                    subjectStatsMap[sId] = {
                        subjectId: sId,
                        name: subj.name,
                        code: subj.code,
                        credits: subj.credits || 3,
                        totalLectures: 0,
                        totalPresent: 0,
                        totalExpected: 0
                    };
                }
                subjectStatsMap[sId].totalLectures++;
                subjectStatsMap[sId].totalPresent += presentCount;
                subjectStatsMap[sId].totalExpected += totalCount;
            }

            const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

            sessionLogs.push({
                sessionId: sess._id,
                date: sess.date,
                className: sess.class?.name || 'Class',
                subjectName: subj?.name || 'Subject',
                subjectCode: subj?.code || '',
                courseName: sess.class?.course?.name || 'Course',
                courseCode: sess.class?.course?.code || '',
                presentCount,
                totalCount,
                attendanceRate,
                passcode: sess.attendanceCode,
                radius: sess.radius
            });
        });

        const subjectList = Object.values(subjectStatsMap).map(s => {
            const avgRate = s.totalExpected > 0 ? Math.round((s.totalPresent / s.totalExpected) * 1000) / 10 : 0;
            return {
                subjectId: s.subjectId,
                name: s.name,
                code: s.code,
                credits: s.credits,
                totalLectures: s.totalLectures,
                attendanceRate: avgRate
            };
        });

        const overallFacultyAvgRate = totalExpectedAll > 0 
            ? Math.round((totalPresentAll / totalExpectedAll) * 1000) / 10 
            : 0;

        res.json({
            faculty: {
                _id: faculty._id,
                name: faculty.name,
                email: faculty.email,
                idNumber: faculty.idNumber || '001',
                department: faculty.department?.name || 'FCAIT',
                assignedSubjects: faculty.assignedSubjects || []
            },
            timeframe,
            dateRange: { start: start.toISOString(), end: end.toISOString() },
            summary: {
                totalLectures: sessions.length,
                totalSubjects: faculty.assignedSubjects?.length || subjectList.length,
                totalVerifiedCheckIns: totalPresentAll,
                averageAttendanceRate: overallFacultyAvgRate
            },
            subjects: subjectList,
            sessions: sessionLogs
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
    getStudentStats,
    stopSession,
    getSessionSummary,
    getStudentAttendanceReport,
    getCourseAttendanceReport,
    getFacultyAttendanceReport
};

