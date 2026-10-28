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

router.use(authorize('admin'));

router.get('/stats', getStats);
router.route('/users')
    .get(getUsers)
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
