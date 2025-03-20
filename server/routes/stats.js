const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/statsController');

// Lấy thống kê tổng quan
router.get('/', auth, getStats);

module.exports = router; 