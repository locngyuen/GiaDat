const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStreets, getStreetById, searchStreets, updateStreet } = require('../controllers/streetController');

// Lấy tất cả đường
router.get('/', getStreets);

// Lấy thông tin một đường cụ thể
router.get('/:id', getStreetById);

// Tìm kiếm đường
router.get('/search/:query', searchStreets);

// Cập nhật thông tin đường (yêu cầu xác thực)
router.put('/:id', auth, updateStreet);

module.exports = router; 