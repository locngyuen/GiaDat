const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Lấy danh sách người dùng
exports.getUsers = async (req, res) => {
  try {
    // Chỉ admin mới có quyền xem danh sách người dùng
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin một người dùng
exports.getUserById = async (req, res) => {
  try {
    // Chỉ admin mới có quyền xem thông tin người dùng khác
    if (req.user.role !== 'admin' && req.params.id !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    // Chỉ admin mới có quyền tạo người dùng
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    const { username, password, fullName, role } = req.body;
    
    // Kiểm tra username đã tồn tại chưa
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Tạo người dùng mới
    const user = new User({
      username,
      password,
      fullName,
      role
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'Tạo người dùng thành công',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi tạo người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role } = req.body;
    
    // Chỉ admin mới có quyền cập nhật người dùng khác
    if (req.user.role !== 'admin' && id !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    // Chỉ admin mới có quyền thay đổi role
    if (req.user.role !== 'admin' && req.body.role) {
      return res.status(403).json({ message: 'Không có quyền thay đổi vai trò' });
    }
    
    const updateData = { fullName };
    
    if (req.user.role === 'admin' && role) {
      updateData.role = role;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({
      message: 'Cập nhật thông tin thành công',
      user
    });
  } catch (error) {
    console.error('Lỗi cập nhật người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    // Chỉ admin mới có quyền xóa người dùng
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    const { id } = req.params;
    
    // Không cho phép xóa chính mình
    if (id === req.user.id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
    }
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Lỗi xóa người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    // Chỉ admin mới có quyền đặt lại mật khẩu người dùng khác
    if (req.user.role !== 'admin' && req.params.id !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    const { id } = req.params;
    
    // Tạo mật khẩu ngẫu nhiên
    const newPassword = Math.random().toString(36).slice(-8);
    
    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Cập nhật mật khẩu
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({
      message: 'Đặt lại mật khẩu thành công',
      newPassword
    });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 