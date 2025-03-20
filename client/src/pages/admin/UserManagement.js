import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  notification,
  Popconfirm
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined,
  LockOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDate } from '../../utils/format';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' hoặc 'edit'
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  
  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu người dùng:', error);
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: 'Không thể tải danh sách người dùng. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Mở modal thêm người dùng
  const showAddModal = () => {
    setModalType('add');
    form.resetFields();
    setModalVisible(true);
  };
  
  // Mở modal chỉnh sửa người dùng
  const showEditModal = (user) => {
    setModalType('edit');
    setEditingUser(user);
    
    form.setFieldsValue({
      username: user.username,
      fullName: user.fullName,
      role: user.role
    });
    
    setModalVisible(true);
  };
  
  // Xử lý thêm/sửa người dùng
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'add') {
        // Thêm người dùng mới
        await axios.post('/api/users', values);
        notification.success({
          message: 'Thêm người dùng thành công',
          description: `Đã thêm người dùng ${values.username}`
        });
      } else {
        // Cập nhật người dùng
        await axios.put(`/api/users/${editingUser._id}`, values);
        notification.success({
          message: 'Cập nhật người dùng thành công',
          description: `Đã cập nhật thông tin người dùng ${values.username}`
        });
      }
      
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Lỗi xử lý người dùng:', error);
      notification.error({
        message: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.'
      });
    }
  };
  
  // Xóa người dùng
  const handleDelete = async (userId) => {
    try {
      await axios.delete(`/api/users/${userId}`);
      
      notification.success({
        message: 'Xóa người dùng thành công',
        description: 'Đã xóa người dùng khỏi hệ thống'
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Lỗi xóa người dùng:', error);
      notification.error({
        message: 'Lỗi xóa người dùng',
        description: error.response?.data?.message || 'Không thể xóa người dùng. Vui lòng thử lại sau.'
      });
    }
  };
  
  // Đặt lại mật khẩu
  const handleResetPassword = async (userId) => {
    try {
      const response = await axios.post(`/api/users/${userId}/reset-password`);
      
      notification.success({
        message: 'Đặt lại mật khẩu thành công',
        description: `Mật khẩu mới: ${response.data.newPassword}`
      });
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      notification.error({
        message: 'Lỗi đặt lại mật khẩu',
        description: error.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.'
      });
    }
  };
  
  // Tải dữ liệu khi component được tải
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Cấu hình bảng
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (text, record, index) => index + 1
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName'
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleMap = {
          admin: 'Quản trị viên',
          editor: 'Biên tập viên',
          viewer: 'Người xem'
        };
        
        return roleMap[role] || role;
      },
      filters: [
        { text: 'Quản trị viên', value: 'admin' },
        { text: 'Biên tập viên', value: 'editor' },
        { text: 'Người xem', value: 'viewer' }
      ],
      onFilter: (value, record) => record.role === value
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (text, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          
          <Button 
            type="default" 
            icon={<LockOutlined />} 
            size="small"
            onClick={() => handleResetPassword(record._id)}
          >
            Đặt lại MK
          </Button>
          
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              type="danger" 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  return (
    <div className="user-management-page">
      <div className="page-header">
        <Title level={2}>Quản lý người dùng</Title>
        
        <Button 
          type="primary" 
          icon={<UserAddOutlined />} 
          onClick={showAddModal}
        >
          Thêm người dùng
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
      />
      
      {/* Modal thêm/sửa người dùng */}
      <Modal
        title={modalType === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={modalType === 'add' ? 'Thêm' : 'Lưu'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input disabled={modalType === 'edit'} />
          </Form.Item>
          
          {modalType === 'add' && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select>
              <Option value="admin">Quản trị viên</Option>
              <Option value="editor">Biên tập viên</Option>
              <Option value="viewer">Người xem</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 