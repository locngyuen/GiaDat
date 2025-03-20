import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { 
  EnvironmentOutlined, 
  PhoneOutlined, 
  MailOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  TwitterOutlined
} from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Title, Text, Link } = Typography;

const Footer = () => {
  return (
    <AntFooter className="app-footer">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8}>
          <Title level={4}>GiáĐất.VN</Title>
          <Text>
            Hệ thống tra cứu giá đất chính xác và cập nhật nhất cho các con đường và khu vực.
            Dễ dàng tìm kiếm và tra cứu giá đất theo địa chỉ hoặc khu vực.
          </Text>
          
          <div className="social-links">
            <Space size="middle">
              <Link href="https://facebook.com" target="_blank">
                <FacebookOutlined />
              </Link>
              <Link href="https://youtube.com" target="_blank">
                <YoutubeOutlined />
              </Link>
              <Link href="https://twitter.com" target="_blank">
                <TwitterOutlined />
              </Link>
            </Space>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Title level={4}>Liên kết</Title>
          <ul className="footer-links">
            <li>
              <Link href="/">Trang chủ</Link>
            </li>
            <li>
              <Link href="/map">Bản đồ giá đất</Link>
            </li>
            <li>
              <Link href="/about">Giới thiệu</Link>
            </li>
            <li>
              <Link href="/contact">Liên hệ</Link>
            </li>
            <li>
              <Link href="/terms">Điều khoản sử dụng</Link>
            </li>
            <li>
              <Link href="/privacy">Chính sách bảo mật</Link>
            </li>
          </ul>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Title level={4}>Liên hệ</Title>
          <ul className="contact-info">
            <li>
              <EnvironmentOutlined /> 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh
            </li>
            <li>
              <PhoneOutlined /> (028) 1234 5678
            </li>
            <li>
              <MailOutlined /> info@giadat.vn
            </li>
          </ul>
        </Col>
      </Row>
      
      <div className="footer-bottom">
        <Text>© {new Date().getFullYear()} GiáĐất.VN. Tất cả quyền được bảo lưu.</Text>
      </div>
    </AntFooter>
  );
};

export default Footer; 