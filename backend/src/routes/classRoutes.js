const express = require('express');
const router = express.Router();
const {
    getClasses,
    createClass,
    getSubjects,
    createSubject,
    getFacultyList,
    createStudent,
    getStudents,
    getFacultyStats
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/classes')
    .get(getClasses)
    .post(createClass);

router.route('/subjects')
    .get(getSubjects)
    .post(createSubject);

router.route('/students')
    .get(getStudents)
    .post(createStudent);

router.get('/faculty-list', getFacultyList);

router.get('/faculty-stats', getFacultyStats);

module.exports = router;
