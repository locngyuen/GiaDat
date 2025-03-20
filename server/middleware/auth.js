const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }
    
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tìm người dùng
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Gán thông tin người dùng vào request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
}; 