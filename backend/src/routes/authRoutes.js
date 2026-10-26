const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, setupFaceId } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/face-setup', protect, setupFaceId);

module.exports = router;
