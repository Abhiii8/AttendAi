const User = require('../models/User');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeClasses = await Class.countDocuments();
        const totalDepartments = await Department.countDocuments();

        // 1. Chart Data (Attendance Volume)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Monthly View (Jan, Feb, Mar... for the year)
        const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
        const monthlyAgg = await Attendance.aggregate([
            { $match: { date: { $gte: startOfYear } } },
            { $group: { _id: { $month: "$date" }, count: { $sum: { $size: "$records" } } } },
            { $sort: { _id: 1 } }
        ]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = months.map((month, index) => {
            const found = monthlyAgg.find(d => d._id === index + 1);
            return { name: month, value: found ? found.count : 0 };
        });

        // Weekly View (Week 1, Week 2, Week 3, Week 4 for the month)
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const weeklyAgg = await Attendance.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: { $week: "$date" }, count: { $sum: { $size: "$records" } } } },
            { $sort: { _id: 1 } }
        ]);
        const weeklyData = [1, 2, 3, 4].map((weekNum, index) => {
            const found = weeklyAgg[index]; // Note: This is an approximation of weeks
            return { name: `Week ${weekNum}`, value: found ? found.count : 0 };
        });

        // Daily View (Sun, Mon, Tue... for the last 7 days)
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - 7);
        const dailyAgg = await Attendance.aggregate([
            { $match: { date: { $gte: startOfWeek } } },
            { $group: { _id: { $dayOfWeek: "$date" }, count: { $sum: { $size: "$records" } } } },
            { $sort: { _id: 1 } }
        ]);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dayIndex = d.getDay();
            const found = dailyAgg.find(x => x._id === dayIndex + 1);
            dailyData.push({
                name: days[dayIndex],
                value: found ? found.count : 0
            });
        }

        // 2. Activity Stream (Latest Users, Classes, Attendances combined)
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
        const recentClasses = await Class.find().populate('subject').populate('faculty').sort({ createdAt: -1 }).limit(5);
        const recentAttendances = await Attendance.find().populate('class').populate('faculty').sort({ createdAt: -1 }).limit(5);

        let stream = [];

        recentUsers.forEach(u => {
            stream.push({
                type: 'user',
                name: u.name,
                action: 'Registered as',
                target: u.role,
                timestamp: u.createdAt,
                initial: u.name.substring(0, 2).toUpperCase(),
                color: 'from-violet-500 to-primary'
            });
        });

        recentClasses.forEach(c => {
            stream.push({
                type: 'class',
                name: c.faculty ? c.faculty.name : 'Faculty',
                action: 'Created new class for',
                target: c.subject ? c.subject.name : 'Unknown Subject',
                timestamp: c.createdAt,
                initial: c.faculty ? c.faculty.name.substring(0, 2).toUpperCase() : 'FA',
                color: 'from-blue-500 to-cyan-400'
            });
        });

        recentAttendances.forEach(a => {
            // Check if class is populated properly
            let targetName = 'a session';
            if (a.class && a.class.name) targetName = a.class.name;
            else if (a.class && typeof a.class === 'object') targetName = 'a class';
            
            stream.push({
                type: 'attendance',
                name: a.faculty ? a.faculty.name : 'Faculty',
                action: 'Opened attendance for',
                target: targetName,
                timestamp: a.createdAt,
                initial: a.faculty ? a.faculty.name.substring(0, 2).toUpperCase() : 'FA',
                color: 'from-emerald-500 to-teal-400'
            });
        });

        // Sort by newest first and take top 8
        stream.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const activityStream = stream.slice(0, 8);

        res.json({
            totalUsers,
            activeClasses,
            totalDepartments,
            chartData: {
                daily: dailyData,
                weekly: weeklyData,
                monthly: monthlyData
            },
            activityStream,
            status: 'All systems operational'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        const users = await User.find(filter)
            .select('-password -faceEmbeddings')
            .populate('department', 'name code')
            .populate('course', 'name code')
            .populate('assignedSubjects', 'name code');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new user (Admin, Faculty, Student)
// @route   POST /api/admin/users
// @access  Private/Admin
// @desc    Create a new user (Admin, Faculty, Student)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { name, email, password, role, course, year, autoAssignEnrollment, department, assignedSubjects } = req.body;
    let { idNumber } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Foreign Key Check: Department exists?
        if (department) {
            const deptExists = await Department.findById(department);
            if (!deptExists) {
                return res.status(400).json({ message: 'Foreign Key Error: The referenced Department does not exist.' });
            }
        }

        // Foreign Key Check: Course exists?
        if (course) {
            const courseExists = await Course.findById(course);
            if (!courseExists) {
                return res.status(400).json({ message: 'Foreign Key Error: The referenced Course does not exist.' });
            }
        }

        // Foreign Key Check: Assigned Subjects exist?
        if (assignedSubjects && Array.isArray(assignedSubjects) && assignedSubjects.length > 0) {
            const validCount = await Subject.countDocuments({ _id: { $in: assignedSubjects } });
            if (validCount !== assignedSubjects.length) {
                return res.status(400).json({ message: 'Foreign Key Error: One or more assigned Subjects do not exist.' });
            }
        }

        // Auto-generate enrollment number for students if requested
        if (role === 'student' && autoAssignEnrollment) {
            const currentYear = new Date().getFullYear();
            // Find the highest enrollment number for this year
            const lastStudent = await User.findOne({ 
                role: 'student', 
                idNumber: new RegExp(`^${currentYear}`) 
            }).sort({ idNumber: -1 });

            if (lastStudent && lastStudent.idNumber) {
                const sequenceStr = lastStudent.idNumber.substring(4); // e.g. "001"
                const nextSequence = parseInt(sequenceStr, 10) + 1;
                idNumber = `${currentYear}${nextSequence.toString().padStart(3, '0')}`;
            } else {
                idNumber = `${currentYear}001`;
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'faculty',
            idNumber,
            department: department || undefined,
            course: role === 'student' ? course : undefined,
            year: role === 'student' ? year : undefined,
            assignedSubjects: role === 'faculty' ? (assignedSubjects || []) : []
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

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private/Admin
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a department
// @route   POST /api/admin/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
    const { name, code } = req.body;
    try {
        const dept = await Department.create({ name, code });
        res.status(201).json(dept);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Foreign Key Check if updating department
        if (req.body.department) {
            const deptExists = await Department.findById(req.body.department);
            if (!deptExists) {
                return res.status(400).json({ message: 'Foreign Key Error: The referenced Department does not exist.' });
            }
            user.department = req.body.department;
        }

        // Foreign Key Check if updating course
        if (req.body.course) {
            const courseExists = await Course.findById(req.body.course);
            if (!courseExists) {
                return res.status(400).json({ message: 'Foreign Key Error: The referenced Course does not exist.' });
            }
            user.course = req.body.course;
        }

        // Foreign Key Check if updating assignedSubjects
        if (req.body.assignedSubjects && Array.isArray(req.body.assignedSubjects)) {
            const validCount = await Subject.countDocuments({ _id: { $in: req.body.assignedSubjects } });
            if (validCount !== req.body.assignedSubjects.length) {
                return res.status(400).json({ message: 'Foreign Key Error: One or more assigned Subjects do not exist.' });
            }
            user.assignedSubjects = req.body.assignedSubjects;
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.idNumber = req.body.idNumber || user.idNumber;
        user.year = req.body.year || user.year;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Referential Integrity Check: If faculty, prevent deleting if active classes or attendance sessions exist
        if (user.role === 'faculty') {
            const activeClasses = await Class.countDocuments({ faculty: user._id });
            if (activeClasses > 0) {
                return res.status(400).json({
                    message: `Referential Integrity Error (Foreign Key RESTRICT): Cannot delete faculty '${user.name}'. They have ${activeClasses} active class session(s) assigned. Reassign them first.`
                });
            }
        }

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        department.name = req.body.name || department.name;
        department.code = req.body.code || department.code;

        const updatedDepartment = await department.save();
        res.json(updatedDepartment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a department
// @route   DELETE /api/admin/departments/:id
// @desc    Delete a department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Foreign Key Integrity Check (RESTRICT mode):
        // Prevent deletion if child branches (courses), subjects, or users are linked
        const linkedCourses = await Course.countDocuments({ department: department._id });
        const linkedUsers = await User.countDocuments({ department: department._id });
        const linkedSubjects = await Subject.countDocuments({ department: department._id });

        if (linkedCourses > 0 || linkedUsers > 0 || linkedSubjects > 0) {
            return res.status(400).json({
                message: `Referential Integrity Error (Foreign Key RESTRICT): Cannot delete department '${department.name}'. It still has ${linkedCourses} branch(es), ${linkedSubjects} subject(s), and ${linkedUsers} user(s) linked to it. Delete or reassign children first.`
            });
        }

        await Department.deleteOne({ _id: department._id });
        res.json({ message: 'Department removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const Course = require('../models/Course');

// @desc    Get all courses (branches)
// @route   GET /api/admin/courses
// @access  Private
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('department', 'name code');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new course (branch)
// @route   POST /api/admin/courses
// @access  Private/Admin
const createCourse = async (req, res) => {
    try {
        const { name, code, department, durationYears, totalSemesters, description } = req.body;
        if (!name || !code || !department) {
            return res.status(400).json({ message: 'Name, code, and department are required' });
        }

        // Foreign Key Check: Verify referenced Department exists
        const deptExists = await Department.findById(department);
        if (!deptExists) {
            return res.status(400).json({ 
                message: 'Foreign Key Error: The referenced Department does not exist in the database.' 
            });
        }

        const existing = await Course.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: 'Course with this code already exists' });
        }

        const course = await Course.create({
            name,
            code: code.toUpperCase(),
            department,
            durationYears: durationYears || 3,
            totalSemesters: totalSemesters || 6,
            description
        });

        const populated = await course.populate('department', 'name code');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/admin/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // If department is updated, verify it exists (Foreign Key Check)
        if (req.body.department) {
            const deptExists = await Department.findById(req.body.department);
            if (!deptExists) {
                return res.status(400).json({ 
                    message: 'Foreign Key Error: The referenced Department does not exist in the database.' 
                });
            }
            course.department = req.body.department;
        }

        course.name = req.body.name || course.name;
        course.code = req.body.code ? req.body.code.toUpperCase() : course.code;
        course.durationYears = req.body.durationYears || course.durationYears;
        course.totalSemesters = req.body.totalSemesters || course.totalSemesters;
        course.description = req.body.description !== undefined ? req.body.description : course.description;

        const updated = await course.save();
        const populated = await updated.populate('department', 'name code');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Foreign Key Integrity Check (RESTRICT mode):
        // Prevent deletion if child subjects or enrolled students exist
        const linkedSubjects = await Subject.countDocuments({ course: course._id });
        const linkedStudents = await User.countDocuments({ course: course._id });

        if (linkedSubjects > 0 || linkedStudents > 0) {
            return res.status(400).json({
                message: `Referential Integrity Error (Foreign Key RESTRICT): Cannot delete course '${course.name}'. It contains ${linkedSubjects} subject(s) and ${linkedStudents} enrolled student(s). Reassign them first.`
            });
        }

        await Course.deleteOne({ _id: course._id });
        res.json({ message: 'Course removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get complete academic department hierarchy
// @route   GET /api/admin/department-hierarchy
// @access  Private
const getDepartmentHierarchy = async (req, res) => {
    try {
        const departments = await Department.find();
        const hierarchy = [];

        for (const dept of departments) {
            const courses = await Course.find({ department: dept._id });
            const faculty = await User.find({ department: dept._id, role: 'faculty' })
                .select('name email idNumber assignedSubjects')
                .populate('assignedSubjects', 'name code credits');
            const subjects = await Subject.find({ department: dept._id })
                .populate('course', 'name code');
            const studentCount = await User.countDocuments({ department: dept._id, role: 'student' });

            hierarchy.push({
                department: dept,
                branches: courses,
                facultyCount: faculty.length,
                faculty: faculty.map(f => ({
                    id: f._id,
                    name: f.name,
                    email: f.email,
                    idNumber: f.idNumber,
                    subjectsCount: f.assignedSubjects?.length || 0,
                    subjects: f.assignedSubjects || []
                })),
                subjects,
                studentCount
            });
        }

        res.status(200).json(hierarchy);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getStats,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getDepartmentHierarchy
};
