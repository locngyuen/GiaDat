import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Upload, 
  message, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Select,
  Divider,
  notification,
  Card,
  Radio
} from 'antd';
import { 
  UploadOutlined, 
  FileExcelOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined,
  InboxOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatCurrency, formatDate } from '../../utils/format';

const { Title, Text } = Typography;
const { Option } = Select;
const { Checkbox } = Checkbox;

const DataManagement = () => {
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStreet, setEditingStreet] = useState(null);
  const [form] = Form.useForm();
  const [uploadType, setUploadType] = useState('market');
  
  // Lấy danh sách đường
  const fetchStreets = async (page = 1, pageSize = 10) => {
    setLoading(true);
    
    try {
      const response = await axios.get(`/api/streets?page=${page}&limit=${pageSize}`);
      
      setStreets(response.data.streets);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.totalPages * pageSize
      });
    } catch (error) {
      console.error('Lỗi lấy dữ liệu đường:', error);
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: 'Không thể tải danh sách đường. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý khi thay đổi trang
  const handleTableChange = (pagination) => {
    fetchStreets(pagination.current, pagination.pageSize);
  };
  
  // Xử lý upload file Excel với loại dữ liệu
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploadLoading(true);
    
    try {
      // Upload file
      const uploadResponse = await axios.post('/api/data/upload', formData);
      
      // Xử lý file
      const processResponse = await axios.post('/api/data/process', {
        filePath: uploadResponse.data.filePath,
        dataType: uploadType
      });
      
      onSuccess('ok', file);
      
      notification.success({
        message: 'Upload thành công',
        description: `Đã cập nhật ${processResponse.data.results.success} bản ghi. ${processResponse.data.results.failed} lỗi.`
      });
      
      // Tải lại danh sách đường
      fetchStreets(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Lỗi upload file:', error);
      onError(error);
      
      notification.error({
        message: 'Upload thất bại',
        description: error.response?.data?.message || 'Không thể upload file. Vui lòng thử lại sau.'
      });
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Mở modal chỉnh sửa
  const handleEdit = (record) => {
    setEditingStreet(record);
    form.setFieldsValue({
      name: record.name,
      district: record.district,
      segments: record.segments.map(segment => ({
        from: segment.from || '',
        to: segment.to || '',
        isFullStreet: segment.isFullStreet,
        marketPrice: segment.marketPrice,
        governmentPrice: segment.governmentPrice
      }))
    });
    setEditModalVisible(true);
  };
  
  // Lưu chỉnh sửa
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      await axios.put(`/api/streets/${editingStreet._id}`, values);
      
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Thông tin đường đã được cập nhật.'
      });
      
      setEditModalVisible(false);
      fetchStreets(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      
      notification.error({
        message: 'Cập nhật thất bại',
        description: error.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.'
      });
    }
  };
  
  // Tải dữ liệu khi component được tải
  useEffect(() => {
    fetchStreets();
  }, []);
  
  // Cấu hình bảng
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: 'Tên đường',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'district',
      key: 'district',
      filters: [
        // Lọc theo quận/huyện
      ],
      onFilter: (value, record) => record.district === value
    },
    {
      title: 'Số đoạn',
      key: 'segments',
      render: (text, record) => record.segments.length
    },
    {
      title: 'Giá thấp nhất',
      key: 'minPrice',
      render: (text, record) => {
        const minPrice = Math.min(...record.segments.map(s => s.marketPrice));
        return formatCurrency(minPrice) + ' VNĐ/m²';
      },
      sorter: (a, b) => {
        const minPriceA = Math.min(...a.segments.map(s => s.marketPrice));
        const minPriceB = Math.min(...b.segments.map(s => s.marketPrice));
        return minPriceA - minPriceB;
      }
    },
    {
      title: 'Giá cao nhất',
      key: 'maxPrice',
      render: (text, record) => {
        const maxPrice = Math.max(...record.segments.map(s => s.marketPrice));
        return formatCurrency(maxPrice) + ' VNĐ/m²';
      },
      sorter: (a, b) => {
        const maxPriceA = Math.max(...a.segments.map(s => s.marketPrice));
        const maxPriceB = Math.max(...b.segments.map(s => s.marketPrice));
        return maxPriceA - maxPriceB;
      }
    },
    {
      title: 'Cập nhật',
      key: 'updatedAt',
      render: (text, record) => formatDate(record.updatedAt),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
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
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
        </Space>
      )
    }
  ];
  
  return (
    <div className="data-management-page">
      <div className="page-header">
        <Title level={2}>Quản lý dữ liệu giá đất</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setEditModalVisible(true)}
        >
          Thêm đường mới
        </Button>
      </div>
      
      <Card className="upload-card" title="Upload dữ liệu từ Excel">
        <div className="upload-options">
          <Radio.Group
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            <Radio.Button value="market">Giá thị trường</Radio.Button>
            <Radio.Button value="government">Giá nhà nước</Radio.Button>
          </Radio.Group>
        </div>
        
        <Upload.Dragger
          name="file"
          accept=".xlsx,.xls"
          customRequest={handleUpload}
          showUploadList={{ showRemoveIcon: false }}
          onChange={handleUploadChange}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kéo thả file Excel hoặc nhấp để chọn file</p>
          <p className="ant-upload-hint">
            Hỗ trợ file Excel (.xlsx, .xls) chứa dữ liệu giá đất {uploadType === 'market' ? 'thị trường' : 'nhà nước'}
          </p>
        </Upload.Dragger>
      </Card>
      
      <Table
        columns={columns}
        dataSource={streets}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        expandable={{
          expandedRowRender: record => (
            <div className="expanded-row">
              <Title level={5}>Chi tiết các đoạn đường</Title>
              <Table
                columns={[
                  {
                    title: 'STT',
                    key: 'index',
                    width: 60,
                    render: (text, record, index) => index + 1
                  },
                  {
                    title: 'Từ',
                    dataIndex: 'from',
                    key: 'from',
                    render: (text, record) => record.isFullStreet ? 'Trọn đường' : text
                  },
                  {
                    title: 'Đến',
                    dataIndex: 'to',
                    key: 'to',
                    render: (text, record) => record.isFullStreet ? '' : text
                  },
                  {
                    title: 'Giá đất (VNĐ/m²)',
                    dataIndex: 'marketPrice',
                    key: 'marketPrice',
                    render: text => formatCurrency(text)
                  }
                ]}
                dataSource={record.segments}
                pagination={false}
                rowKey={(record, index) => `${record._id}-${index}`}
              />
            </div>
          )
        }}
      />
      
      {/* Modal chỉnh sửa */}
      <Modal
        title={editingStreet ? 'Chỉnh sửa thông tin đường' : 'Thêm đường mới'}
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ segments: [{ isFullStreet: false }] }}
        >
          <Form.Item
            name="name"
            label="Tên đường"
            rules={[{ required: true, message: 'Vui lòng nhập tên đường!' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="district"
            label="Quận/Huyện"
            rules={[{ required: true, message: 'Vui lòng nhập quận/huyện!' }]}
          >
            <Input />
          </Form.Item>
          
          <Divider orientation="left">Các đoạn đường</Divider>
          
          <Form.List name="segments">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="segment-form-item">
                    <Form.Item
                      {...restField}
                      name={[name, 'isFullStreet']}
                      valuePropName="checked"
                    >
                      <Checkbox>Trọn đường</Checkbox>
                    </Form.Item>
                    
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.segments[name]?.isFullStreet !== currentValues.segments[name]?.isFullStreet
                      }
                    >
                      {({ getFieldValue }) => {
                        const isFullStreet = getFieldValue(['segments', name, 'isFullStreet']);
                        
                        return !isFullStreet ? (
                          <div className="segment-range">
                            <Form.Item
                              {...restField}
                              name={[name, 'from']}
                              rules={[{ required: true, message: 'Vui lòng nhập điểm bắt đầu!' }]}
                            >
                              <Input placeholder="Từ" />
                            </Form.Item>
                            
                            <Form.Item
                              {...restField}
                              name={[name, 'to']}
                              rules={[{ required: true, message: 'Vui lòng nhập điểm kết thúc!' }]}
                            >
                              <Input placeholder="Đến" />
                            </Form.Item>
                          </div>
                        ) : null;
                      }}
                    </Form.Item>
                    
                    <div className="segment-price-actions">
                      <Form.Item
                        {...restField}
                        name={[name, 'marketPrice']}
                        label="Giá thị trường (VNĐ/m²)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá thị trường!' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          placeholder="Giá thị trường"
                        />
                      </Form.Item>
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'governmentPrice']}
                        label="Giá nhà nước (VNĐ/m²)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá nhà nước!' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          placeholder="Giá nhà nước"
                        />
                      </Form.Item>
                      
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </div>
                  </div>
                ))}
                
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ 
                      isFullStreet: false, 
                      from: '', 
                      to: '', 
                      marketPrice: 0,
                      governmentPrice: 0 
                    })}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm đoạn đường
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default DataManagement; 