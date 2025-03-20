const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadExcel, processExcel } = require('../controllers/dataController');

// Upload file Excel (yêu cầu xác thực)
router.post('/upload', auth, uploadExcel);

// Xử lý và cập nhật dữ liệu từ file Excel (yêu cầu xác thực)
router.post('/process', auth, processExcel);

module.exports = router; 