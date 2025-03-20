const Street = require('../models/Street');

// Lấy tất cả đường
exports.getStreets = async (req, res) => {
  try {
    const { page = 1, limit = 20, district } = req.query;
    
    const query = district ? { district } : {};
    
    const streets = await Street.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
      
    const count = await Street.countDocuments(query);
    
    res.json({
      streets,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin một đường cụ thể
exports.getStreetById = async (req, res) => {
  try {
    const street = await Street.findById(req.params.id);
    
    if (!street) {
      return res.status(404).json({ message: 'Không tìm thấy đường' });
    }
    
    res.json(street);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tìm kiếm đường
exports.searchStreets = async (req, res) => {
  try {
    const { query } = req.params;
    
    const streets = await Street.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { 'segments.from': { $regex: query, $options: 'i' } },
        { 'segments.to': { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json(streets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật thông tin đường
exports.updateStreet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, district, segments } = req.body;
    
    // Kiểm tra quyền (chỉ admin và editor mới được cập nhật)
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Không có quyền cập nhật' });
    }
    
    const updatedStreet = await Street.findByIdAndUpdate(
      id,
      {
        name,
        district,
        segments,
        updatedAt: Date.now(),
        updatedBy: req.user.id
      },
      { new: true }
    );
    
    if (!updatedStreet) {
      return res.status(404).json({ message: 'Không tìm thấy đường' });
    }
    
    res.json(updatedStreet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 