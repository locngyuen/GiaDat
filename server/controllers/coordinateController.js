const { vn2000ToWGS84 } = require('../utils/coordinateConverter');
const axios = require('axios');

exports.convertVN2000ToWGS84 = async (req, res) => {
  try {
    const { x, y } = req.body;
    
    if (!x || !y) {
      return res.status(400).json({ message: 'Thiếu tọa độ X hoặc Y' });
    }
    
    const result = vn2000ToWGS84(parseFloat(x), parseFloat(y));
    
    res.json(result);
  } catch (error) {
    console.error('Lỗi chuyển đổi tọa độ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Vui lòng nhập địa chỉ' });
    }
    
    // Sử dụng OpenStreetMap Nominatim API để geocode địa chỉ
    // Lưu ý: Trong môi trường production, nên sử dụng geocoding API có khả năng xử lý địa chỉ Việt Nam tốt hơn
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${address}, Vietnam`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GiaDatVN Application'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      res.json({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }
  } catch (error) {
    console.error('Lỗi geocoding:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 