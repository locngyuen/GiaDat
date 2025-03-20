import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Nếu đang tải dữ liệu người dùng
  if (loading) {
    return <div className="loading-container">Đang tải...</div>;
  }
  
  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Nếu có yêu cầu về vai trò và người dùng không có vai trò phù hợp
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  // Nếu đã đăng nhập và có quyền truy cập
  return children;
};

export default PrivateRoute; 