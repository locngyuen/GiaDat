import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { notification } from 'antd';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Thiết lập token cho axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Kiểm tra xác thực khi tải trang
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Lỗi xác thực:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [token]);
  
  // Đăng nhập
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      notification.success({
        message: 'Đăng nhập thành công',
        description: `Xin chào, ${user.fullName}!`
      });
      
      return true;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      
      notification.error({
        message: 'Đăng nhập thất bại',
        description: error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
      
      return false;
    }
  };
  
  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 