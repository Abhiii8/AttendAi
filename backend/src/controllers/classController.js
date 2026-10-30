const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const Course = require('../models/Course');

// @desc    Get all classes for logged in user (Faculty or Student)
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
    try {
        let classes;
        if (req.user.role === 'faculty') {
            classes = await Class.find({ faculty: req.user._id }).populate('subject').populate('faculty', 'name');
        } else if (req.user.role === 'student') {
            const Attendance = require('../models/Attendance');
            const attendedSessions = await Attendance.find({ 'records.student': req.user._id }).distinct('class');
            
            classes = await Class.find({ 
                $or: [
                    { students: req.user._id },
                    { _id: { $in: attendedSessions } }
                ]
            }).populate('subject').populate('faculty', 'name');
        } else {
            classes = await Class.find().populate('subject').populate('faculty', 'name');
        }
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new class (Timetable Block) or Append Schedule to Existing Class
// @route   POST /api/classes
// @access  Private/Faculty
const createClass = async (req, res) => {
    const { name, subject, schedule, faculty } = req.body;
    const facultyId = faculty || req.user._id;
    try {
        // Foreign Key Validation: Subject must exist in database
        if (subject) {
            const subjectDoc = await Subject.findById(subject);
            if (!subjectDoc) {
                return res.status(400).json({ message: 'Foreign Key Error: Referenced Subject does not exist in the database.' });
            }
        }

        // Look for an existing class by this name and faculty
        let existingClass = await Class.findOne({ name, faculty: facultyId });
        
        if (existingClass) {
            // Append the new schedule slots to the existing class
            if (schedule && schedule.length > 0) {
                existingClass.schedule.push(...schedule);
                await existingClass.save();
            }
            // Optional: update subject if provided and different
            if (subject && existingClass.subject && existingClass.subject.toString() !== subject) {
                existingClass.subject = subject;
                await existingClass.save();
            }
            const populatedClass = await existingClass.populate('subject');
            return res.status(200).json(populatedClass);
        }

        // If it doesn't exist, create a new one
        const newClass = await Class.create({
            name,
            subject,
            faculty: facultyId,
            schedule: schedule || []
        });
        const populatedClass = await newClass.populate('subject');
        res.status(201).json(populatedClass);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate('department').populate('course');
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private (Faculty/Admin)
const createSubject = async (req, res) => {
    const { name, code, department, course, semester, credits } = req.body;
    try {
        if (!name || !code) {
            return res.status(400).json({ message: 'Please provide name and code' });
        }

        // Foreign Key Check: Department exists
        if (department) {
            const dept = await Department.findById(department);
            if (!dept) {
                return res.status(400).json({ message: 'Foreign Key Error: Referenced Department does not exist in the database.' });
            }
        }

        // Foreign Key Check: Course exists
        if (course) {
            const crs = await Course.findById(course);
            if (!crs) {
                return res.status(400).json({ message: 'Foreign Key Error: Referenced Course does not exist in the database.' });
            }
        }
        
        const subjectExists = await Subject.findOne({ code: code.toUpperCase() });
        if (subjectExists) {
            return res.status(400).json({ message: 'Subject with this code already exists' });
        }

        const subject = await Subject.create({
            name,
            code: code.toUpperCase(),
            department: department || undefined,
            course: course || undefined,
            semester: semester || 1,
            credits: credits || 3
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const User = require('../models/User');

// @desc    Get all faculty members for assignment
// @route   GET /api/faculty-list
// @access  Private
const getFacultyList = async (req, res) => {
    try {
        const faculty = await User.find({ role: 'faculty' })
            .select('name email idNumber department course assignedSubjects')
            .populate('department', 'name code')
            .populate('course', 'name code')
            .sort({ name: 1 });
        res.status(200).json(faculty);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Faculty creates a student account
// @route   POST /api/students
// @access  Private/Faculty
const createStudent = async (req, res) => {
    const { name, email, password, idNumber, department, course, year, autoAssignEnrollment, faceEmbeddings } = req.body;
    let finalIdNumber = idNumber;

    try {
        // Handle Auto-Enrollment logic for students
        if (autoAssignEnrollment) {
            const currentYear = new Date().getFullYear();
            const lastStudent = await User.findOne({ role: 'student', idNumber: new RegExp(`^${currentYear}`) })
                                        .sort({ idNumber: -1 });
            if (lastStudent && lastStudent.idNumber) {
                const sequenceStr = lastStudent.idNumber.substring(4);
                const sequence = parseInt(sequenceStr, 10);
                if (!isNaN(sequence)) {
                    finalIdNumber = `${currentYear}${String(sequence + 1).padStart(3, '0')}`;
                } else {
                    finalIdNumber = `${currentYear}001`;
                }
            } else {
                finalIdNumber = `${currentYear}001`;
            }
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'student',
            idNumber: finalIdNumber,
            department: department || undefined,
            course,
            year,
            faceEmbeddings: faceEmbeddings || []
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            idNumber: user.idNumber
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Faculty
const getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password').populate('department');
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const Attendance = require('../models/Attendance');

// @desc    Get dashboard stats for faculty
// @route   GET /api/faculty-stats
// @access  Private/Faculty
const getFacultyStats = async (req, res) => {
    try {
        const classes = await Class.find({ faculty: req.user._id });
        const totalClasses = classes.length;
        
        // Count unique students across all classes
        const studentIds = new Set();
        classes.forEach(c => {
            if (c.students) {
                c.students.forEach(id => studentIds.add(id.toString()));
            }
        });
        const totalStudents = studentIds.size;

        const totalSessions = await Attendance.countDocuments({ faculty: req.user._id });

        // Get upcoming lectures for today
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayStr = days[new Date().getDay()];
        
        let upcomingLectures = [];
        for (const c of classes) {
            const todaySlots = c.schedule.filter(s => s.dayOfWeek === todayStr);
            for (const slot of todaySlots) {
                upcomingLectures.push({
                    className: c.name,
                    subjectId: c.subject,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    room: slot.room
                });
            }
        }
        
        // Sort by start time
        upcomingLectures.sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Get recent activity (last 5 sessions)
        const recentSessions = await Attendance.find({ faculty: req.user._id })
            .populate({ path: 'class', select: 'name' })
            .sort({ date: -1 })
            .limit(5);
            
        const activityStream = recentSessions.map(session => {
            const presentCount = session.records.filter(r => r.status === 'Present').length;
            return {
                timestamp: session.date,
                name: 'You',
                action: 'marked attendance for',
                target: `${session.class?.name} (${presentCount}/${session.records.length} present)`,
                color: 'from-blue-500 to-purple-600',
                initial: 'F'
            };
        });

        res.status(200).json({
            totalClasses,
            totalStudents,
            totalSessions,
            upcomingLectures: upcomingLectures.slice(0, 5),
            activityStream
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getClasses,
    createClass,
    getSubjects,
    createSubject,
    getFacultyList,
    createStudent,
    getStudents,
    getFacultyStats
};
