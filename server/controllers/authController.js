const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Tìm người dùng
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Tạo token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Trả về thông tin người dùng và token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin người dùng hiện tại
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 