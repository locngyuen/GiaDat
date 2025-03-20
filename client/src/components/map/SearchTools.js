import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Alert, notification } from 'antd';
import axios from 'axios';

const { TabPane } = Tabs;

const SearchTools = ({ onLocationFound }) => {
  const [addressLoading, setAddressLoading] = useState(false);
  const [coordinateLoading, setCoordinateLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [addressForm] = Form.useForm();
  const [coordinateForm] = Form.useForm();
  
  // Tìm kiếm địa chỉ
  const handleAddressSearch = async (values) => {
    setError(null);
    setAddressLoading(true);
    
    try {
      const response = await axios.post('/api/coordinate/geocode', {
        address: values.address
      });
      
      const { lat, lng, displayName } = response.data;
      
      onLocationFound({
        lat,
        lng,
        popupContent: displayName
      });
      
      notification.success({
        message: 'Tìm thấy địa chỉ',
        description: displayName
      });
    } catch (error) {
      console.error('Lỗi tìm kiếm địa chỉ:', error);
      
      setError(
        error.response?.data?.message || 
        'Không thể tìm kiếm địa chỉ. Vui lòng thử lại sau.'
      );
    } finally {
      setAddressLoading(false);
    }
  };
  
  // Chuyển đổi tọa độ
  const handleCoordinateConvert = async (values) => {
    setError(null);
    setCoordinateLoading(true);
    
    try {
      const response = await axios.post('/api/coordinate/convert', {
        x: values.x,
        y: values.y
      });
      
      const { lat, lng } = response.data;
      
      onLocationFound({
        lat,
        lng,
        popupContent: `Tọa độ VN2000: X=${values.x}, Y=${values.y}`
      });
      
      notification.success({
        message: 'Chuyển đổi tọa độ thành công',
        description: `Tọa độ WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    } catch (error) {
      console.error('Lỗi chuyển đổi tọa độ:', error);
      
      setError(
        error.response?.data?.message || 
        'Không thể chuyển đổi tọa độ. Vui lòng thử lại sau.'
      );
    } finally {
      setCoordinateLoading(false);
    }
  };
  
  return (
    <Card className="search-tools-card">
      <Tabs defaultActiveKey="address">
        <TabPane tab="Tìm kiếm địa chỉ" key="address">
          <Form
            form={addressForm}
            layout="vertical"
            onFinish={handleAddressSearch}
          >
            <Form.Item
              name="address"
              label="Địa chỉ"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
            >
              <Input placeholder="Nhập địa chỉ..." />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={addressLoading}
                block
              >
                Tìm kiếm
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="Chuyển đổi tọa độ VN2000" key="coordinate">
          <Form
            form={coordinateForm}
            layout="vertical"
            onFinish={handleCoordinateConvert}
          >
            <Form.Item
              name="x"
              label="Tọa độ X (Easting)"
              rules={[{ required: true, message: 'Vui lòng nhập tọa độ X' }]}
            >
              <Input type="number" placeholder="Nhập tọa độ X..." />
            </Form.Item>
            
            <Form.Item
              name="y"
              label="Tọa độ Y (Northing)"
              rules={[{ required: true, message: 'Vui lòng nhập tọa độ Y' }]}
            >
              <Input type="number" placeholder="Nhập tọa độ Y..." />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={coordinateLoading}
                block
              >
                Chuyển đổi
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
      
      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default SearchTools; 