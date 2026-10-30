const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Department hierarchy view accessible to all authenticated users
router.get('/department-hierarchy', getDepartmentHierarchy);
router.get('/courses', getCourses);

// Allow all authenticated users to fetch faculty list
router.get('/faculty-list', async (req, res) => {
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

// Allow fetching faculty users for reports without requiring admin role
router.get('/users', (req, res, next) => {
    if (req.query && req.query.role === 'faculty') {
        return getUsers(req, res);
    }
    return authorize('admin')(req, res, () => getUsers(req, res));
});

router.use(authorize('admin'));

router.get('/stats', getStats);
router.route('/users')
    .post(createUser);

router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

router.route('/departments')
    .get(getDepartments)
    .post(createDepartment);

router.route('/departments/:id')
    .put(updateDepartment)
    .delete(deleteDepartment);

router.route('/courses')
    .post(createCourse);

router.route('/courses/:id')
    .put(updateCourse)
    .delete(deleteCourse);

module.exports = router;
