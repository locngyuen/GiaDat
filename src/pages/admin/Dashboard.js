import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Button,
  DatePicker,
  Spin
} from 'antd';
import { 
  BarChartOutlined, 
  RiseOutlined, 
  TeamOutlined, 
  FileOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStreets: 0,
    totalSegments: 0,
    totalUsers: 0,
    avgPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    recentUpdates: [],
    priceChanges: []
  });
  
  // Lấy thống kê
  const fetchStats = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Lỗi lấy thống kê:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Tải dữ liệu khi component được tải
  useEffect(() => {
    fetchStats();
  }, []);
  
  // Cấu hình bảng cập nhật gần đây
  const recentUpdatesColumns = [
    {
      title: 'Tên đường',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'district',
      key: 'district'
    },
    {
      title: 'Người cập nhật',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: (user) => user?.fullName || 'N/A'
    },
    {
      title: 'Thời gian',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => formatDate(date)
    }
  ];
  
  // Cấu hình bảng thay đổi giá
  const priceChangesColumns = [
    {
      title: 'Tên đường',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Đoạn',
      key: 'segment',
      render: (text, record) => {
        return record.segment.isFullStreet 
          ? 'Trọn đường' 
          : `Từ ${record.segment.from} đến ${record.segment.to}`;
      }
    },
    {
      title: 'Giá cũ',
      dataIndex: 'oldPrice',
      key: 'oldPrice',
      render: (price) => formatCurrency(price) + ' VNĐ/m²'
    },
    {
      title: 'Giá mới',
      dataIndex: 'newPrice',
      key: 'newPrice',
      render: (price) => formatCurrency(price) + ' VNĐ/m²'
    },
    {
      title: 'Thay đổi',
      key: 'change',
      render: (text, record) => {
        const change = record.newPrice - record.oldPrice;
        const percentChange = (change / record.oldPrice) * 100;
        
        return (
          <span style={{ color: change >= 0 ? '#3f8600' : '#cf1322' }}>
            {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {formatCurrency(Math.abs(change))} VNĐ ({percentChange.toFixed(2)}%)
          </span>
        );
      }
    }
  ];
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Title level={2}>Bảng điều khiển</Title>
        <Text>Xin chào, {user?.fullName}!</Text>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng số đường"
                  value={stats.totalStreets}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng số đoạn đường"
                  value={stats.totalSegments}
                  prefix={<FileOutlined />}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Giá trung bình"
                  value={stats.avgPrice}
                  precision={0}
                  suffix="VNĐ/m²"
                  prefix={<RiseOutlined />}
                  formatter={(value) => formatCurrency(value)}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng số người dùng"
                  value={stats.totalUsers}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card 
                title="Cập nhật gần đây" 
                extra={
                  <Link to="/admin/data">
                    <Button type="link">Xem tất cả</Button>
                  </Link>
                }
              >
                <Table
                  columns={recentUpdatesColumns}
                  dataSource={stats.recentUpdates}
                  rowKey="_id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                title="Thay đổi giá đất" 
                extra={
                  <RangePicker 
                    onChange={(dates) => {
                      // Xử lý khi thay đổi khoảng thời gian
                    }} 
                  />
                }
              >
                <Table
                  columns={priceChangesColumns}
                  dataSource={stats.priceChanges}
                  rowKey="_id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title="Thống kê giá đất">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Giá thấp nhất"
                      value={stats.minPrice}
                      precision={0}
                      suffix="VNĐ/m²"
                      formatter={(value) => formatCurrency(value)}
                    />
                  </Col>
                  
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Giá trung bình"
                      value={stats.avgPrice}
                      precision={0}
                      suffix="VNĐ/m²"
                      formatter={(value) => formatCurrency(value)}
                    />
                  </Col>
                  
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Giá cao nhất"
                      value={stats.maxPrice}
                      precision={0}
                      suffix="VNĐ/m²"
                      formatter={(value) => formatCurrency(value)}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard; 