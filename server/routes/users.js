const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
} = require('../controllers/userController');

// Lấy danh sách người dùng
router.get('/', auth, getUsers);

// Lấy thông tin một người dùng
router.get('/:id', auth, getUserById);

// Tạo người dùng mới
router.post('/', auth, createUser);

// Cập nhật thông tin người dùng
router.put('/:id', auth, updateUser);

// Xóa người dùng
router.delete('/:id', auth, deleteUser);

// Đặt lại mật khẩu
router.post('/:id/reset-password', auth, resetPassword);

module.exports = router; 