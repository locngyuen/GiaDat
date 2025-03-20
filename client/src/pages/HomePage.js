import React from 'react';
import { Typography, Button, Row, Col, Card, Statistic } from 'antd';
import { Link } from 'react-router-dom';
import { 
  EnvironmentOutlined, 
  SearchOutlined, 
  DatabaseOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <Title>Hệ thống tra cứu giá đất</Title>
          <Paragraph>
            Cung cấp thông tin giá đất chính xác và cập nhật nhất cho các con đường và khu vực.
            Dễ dàng tìm kiếm và tra cứu giá đất theo địa chỉ hoặc khu vực.
          </Paragraph>
          <Link to="/map">
            <Button type="primary" size="large" icon={<SearchOutlined />}>
              Tra cứu ngay
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="features-section">
        <Title level={2} className="section-title">Tính năng nổi bật</Title>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card className="feature-card">
              <EnvironmentOutlined className="feature-icon" />
              <Title level={4}>Bản đồ tương tác</Title>
              <Paragraph>
                Hiển thị giá đất theo vị trí con trỏ chuột trên bản đồ, giúp bạn dễ dàng xem giá đất ở bất kỳ vị trí nào.
              </Paragraph>
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card className="feature-card">
              <SearchOutlined className="feature-icon" />
              <Title level={4}>Tìm kiếm thông minh</Title>
              <Paragraph>
                Tìm kiếm nhanh chóng theo tên đường, số nhà hoặc khu vực để định vị chính xác vị trí bạn quan tâm.
              </Paragraph>
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card className="feature-card">
              <DatabaseOutlined className="feature-icon" />
              <Title level={4}>Dữ liệu cập nhật</Title>
              <Paragraph>
                Dữ liệu giá đất được cập nhật thường xuyên từ nguồn chính thống, đảm bảo thông tin luôn chính xác và mới nhất.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
      
      <div className="stats-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic 
                title="Số lượng đường" 
                value={1000} 
                suffix="+" 
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card>
              <Statistic 
                title="Quận/Huyện" 
                value={24} 
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card>
              <Statistic 
                title="Cập nhật gần nhất" 
                value="15/07/2023" 
              />
            </Card>
          </Col>
        </Row>
      </div>
      
      <div className="cta-section">
        <Card className="cta-card">
          <Title level={3}>Bắt đầu tra cứu ngay hôm nay</Title>
          <Paragraph>
            Truy cập bản đồ để xem thông tin giá đất chi tiết cho các khu vực bạn quan tâm.
          </Paragraph>
          <Link to="/map">
            <Button type="primary" size="large">
              Đi đến bản đồ <ArrowRightOutlined />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default HomePage; 