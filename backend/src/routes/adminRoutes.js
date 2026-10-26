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
    deleteDepartment
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
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

module.exports = router;
