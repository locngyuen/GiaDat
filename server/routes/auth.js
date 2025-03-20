const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Đăng nhập
router.post('/login', login);

// Lấy thông tin người dùng hiện tại
router.get('/me', auth, getMe);

module.exports = router; 