const express = require('express');
const router = express.Router();
const { convertVN2000ToWGS84, geocodeAddress } = require('../controllers/coordinateController');

// Chuyển đổi tọa độ từ VN2000 sang WGS84
router.post('/convert', convertVN2000ToWGS84);

// Geocoding địa chỉ
router.post('/geocode', geocodeAddress);

module.exports = router; 