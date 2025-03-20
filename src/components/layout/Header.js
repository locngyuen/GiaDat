import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { 
  HomeOutlined, 
  EnvironmentOutlined, 
  UserOutlined, 
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Menu dropdown cho người dùng đã đăng nhập
  const userMenu = (
    <Menu>
      {(user?.role === 'admin' || user?.role === 'editor') && (
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to="/admin">Bảng điều khiển</Link>
        </Menu.Item>
      )}
      
      {(user?.role === 'admin' || user?.role === 'editor') && (
        <Menu.Item key="data" icon={<DatabaseOutlined />}>
          <Link to="/admin/data">Quản lý dữ liệu</Link>
        </Menu.Item>
      )}
      
      {user?.role === 'admin' && (
        <Menu.Item key="users" icon={<TeamOutlined />}>
          <Link to="/admin/users">Quản lý người dùng</Link>
        </Menu.Item>
      )}
      
      <Menu.Divider />
      
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );
  
  return (
    <AntHeader className="app-header">
      <div className="logo">
        <Link to="/">
          <h1>GiáĐất.VN</h1>
        </Link>
      </div>
      
      <Menu 
        theme="dark" 
        mode="horizontal" 
        selectedKeys={[location.pathname]}
      >
        <Menu.Item key="/" icon={<HomeOutlined />}>
          <Link to="/">Trang chủ</Link>
        </Menu.Item>
        
        <Menu.Item key="/map" icon={<EnvironmentOutlined />}>
          <Link to="/map">Bản đồ giá đất</Link>
        </Menu.Item>
      </Menu>
      
      <div className="header-right">
        {isAuthenticated ? (
          <Dropdown overlay={userMenu} trigger={['click']}>
            <div className="user-info">
              <Avatar icon={<UserOutlined />} />
              <span className="username">{user.fullName}</span>
            </div>
          </Dropdown>
        ) : (
          <Link to="/login">
            <Button type="primary" icon={<UserOutlined />}>
              Đăng nhập
            </Button>
          </Link>
        )}
      </div>
    </AntHeader>
  );
};

export default Header; 