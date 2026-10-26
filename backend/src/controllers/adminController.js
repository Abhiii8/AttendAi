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
        const users = await User.find().select('-password -faceEmbeddings');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new user (Admin, Faculty, Student)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { name, email, password, role, course, year, autoAssignEnrollment, department } = req.body;
    let { idNumber } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
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
            year: role === 'student' ? year : undefined
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

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.idNumber = req.body.idNumber || user.idNumber;
        user.department = req.body.department || user.department;
        user.course = req.body.course || user.course;
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
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
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
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await Department.deleteOne({ _id: department._id });
        res.json({ message: 'Department removed' });
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
    deleteDepartment
};
