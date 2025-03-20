import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Input, Card, Spin, notification, Radio } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import PriceMarker from '../components/map/PriceMarker';
import StreetSegment from '../components/map/StreetSegment';
import SearchTools from '../components/map/SearchTools';
import { formatCurrency } from '../utils/format';

// Fix cho icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const { Search } = Input;

const MapPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [center, setCenter] = useState([10.7769, 106.7009]); // Tọa độ TP.HCM
  const [zoom, setZoom] = useState(13);
  const [priceType, setPriceType] = useState('market'); // 'market' hoặc 'government'
  const [searchLocation, setSearchLocation] = useState(null);
  
  const mapRef = useRef(null);
  
  // Xử lý tìm kiếm
  const handleSearch = async (value) => {
    if (!value.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await axios.get(`/api/streets/search/${value}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
      notification.error({
        message: 'Lỗi tìm kiếm',
        description: 'Không thể tìm kiếm địa chỉ. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý khi chọn một kết quả tìm kiếm
  const handleSelectResult = (street) => {
    setSelectedStreet(street);
    
    // Lấy tọa độ trung tâm của đường
    if (street.segments && street.segments.length > 0 && street.segments[0].coordinates) {
      const coords = street.segments[0].coordinates.coordinates;
      if (coords && coords.length > 0) {
        // Lấy điểm giữa của đoạn đường
        const midIndex = Math.floor(coords.length / 2);
        setCenter([coords[midIndex][1], coords[midIndex][0]]);
        setZoom(16);
      }
    }
    
    setSearchResults([]);
  };
  
  // Xử lý khi tìm thấy vị trí từ tìm kiếm
  const handleLocationFound = (location) => {
    setSearchLocation(location);
    setCenter([location.lat, location.lng]);
    setZoom(17);
  };
  
  // Component theo dõi sự kiện di chuột trên bản đồ
  const MapEvents = () => {
    useMapEvents({
      mousemove: (e) => {
        setHoveredPoint({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    });
    
    return null;
  };
  
  // Tìm giá đất tại vị trí con trỏ
  const findPriceAtPoint = () => {
    if (!hoveredPoint || !streets.length) return null;
    
    // Tìm đoạn đường gần nhất
    let closestSegment = null;
    let minDistance = Infinity;
    
    streets.forEach(street => {
      street.segments.forEach(segment => {
        if (segment.coordinates && segment.coordinates.coordinates) {
          const coords = segment.coordinates.coordinates;
          
          // Tính khoảng cách từ điểm đến đoạn đường
          for (let i = 0; i < coords.length - 1; i++) {
            const p1 = L.latLng(coords[i][1], coords[i][0]);
            const p2 = L.latLng(coords[i+1][1], coords[i+1][0]);
            const point = L.latLng(hoveredPoint.lat, hoveredPoint.lng);
            
            const distance = L.GeometryUtil.distanceSegment(mapRef.current, point, p1, p2);
            
            if (distance < minDistance && distance < 50) { // Trong phạm vi 50m
              minDistance = distance;
              closestSegment = {
                street: street.name,
                segment: segment,
                distance
              };
            }
          }
        }
      });
    });
    
    return closestSegment;
  };
  
  // Lấy danh sách đường khi component được tải
  useEffect(() => {
    const fetchStreets = async () => {
      try {
        const response = await axios.get('/api/streets');
        setStreets(response.data.streets);
      } catch (error) {
        console.error('Lỗi lấy dữ liệu đường:', error);
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: 'Không thể tải dữ liệu đường. Vui lòng thử lại sau.'
        });
      }
    };
    
    fetchStreets();
  }, []);
  
  // Tìm giá đất tại vị trí con trỏ
  const priceInfo = findPriceAtPoint();
  
  // Xử lý khi thay đổi loại giá đất hiển thị
  const handlePriceTypeChange = (e) => {
    setPriceType(e.target.value);
  };
  
  return (
    <div className="map-page-container">
      <div className="map-toolbar">
        <Radio.Group 
          value={priceType} 
          onChange={handlePriceTypeChange}
          options={[
            { label: 'Giá thị trường', value: 'market' },
            { label: 'Giá nhà nước', value: 'government' }
          ]}
          optionType="button"
          buttonStyle="solid"
        />
      </div>
      
      <div className="map-content">
        <div className="map-sidebar">
          <SearchTools onLocationFound={handleLocationFound} />
          
          <Card className="search-result-card" title="Kết quả tìm kiếm" size="small">
            {searchResults.length > 0 ? (
              <ul className="search-result-list">
                {searchResults.map((street, index) => (
                  <li 
                    key={index} 
                    className="search-result-item"
                    onClick={() => handleSelectResult(street)}
                  >
                    <b>{street.name}</b>
                    <div>Quận/Huyện: {street.district}</div>
                    <div>
                      Giá: {formatCurrency(
                        priceType === 'market' 
                          ? street.segments[0].marketPrice 
                          : street.segments[0].governmentPrice
                      )} VNĐ/m²
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-result">Tìm kiếm đường phố hoặc địa chỉ</div>
            )}
          </Card>
        </div>
        
        <div className="map-wrapper">
          <div className="search-container">
            <Input.Search
              placeholder="Tìm kiếm đường phố..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              loading={loading}
            />
          </div>
          
          <MapContainer 
            center={center} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapEvents />
            
            {/* Hiển thị các đoạn đường */}
            {streets.map(street => (
              street.segments.map((segment, index) => (
                segment.coordinates && (
                  <StreetSegment
                    key={`${street._id}-${index}`}
                    street={street}
                    segment={segment}
                    isSelected={selectedStreet && selectedStreet._id === street._id}
                    priceType={priceType}
                  />
                )
              ))
            ))}
            
            {/* Hiển thị marker giá đất tại vị trí con trỏ */}
            {priceInfo && (
              <PriceMarker
                position={[hoveredPoint.lat, hoveredPoint.lng]}
                street={priceInfo.street}
                segment={priceInfo.segment}
              />
            )}
            
            {/* Hiển thị thông tin đường được chọn */}
            {selectedStreet && (
              <Marker 
                position={center}
                icon={L.divIcon({
                  className: 'selected-street-marker',
                  html: `<div class="street-info-popup">${selectedStreet.name}</div>`,
                  iconSize: [120, 40]
                })}
              >
                <Popup>
                  <div>
                    <h3>{selectedStreet.name}</h3>
                    <p>Quận/Huyện: {selectedStreet.district}</p>
                    <p>Giá thị trường: {formatCurrency(selectedStreet.segments[0].marketPrice)} VNĐ/m²</p>
                    <p>Giá nhà nước: {formatCurrency(selectedStreet.segments[0].governmentPrice)} VNĐ/m²</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Hiển thị marker cho địa điểm đã tìm kiếm */}
            {searchLocation && (
              <Marker position={[searchLocation.lat, searchLocation.lng]}>
                <Popup>
                  <div>{searchLocation.popupContent}</div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
      
      {/* Hiển thị thông tin giá đất */}
      {priceInfo && (
        <div className="price-info-panel">
          <h3>{priceInfo.street}</h3>
          <p>
            {priceInfo.segment.isFullStreet 
              ? 'Trọn đường' 
              : `Từ ${priceInfo.segment.from} đến ${priceInfo.segment.to}`}
          </p>
          <h2>
            Giá {priceType === 'market' ? 'thị trường' : 'nhà nước'}: {' '}
            {formatCurrency(
              priceType === 'market' 
                ? priceInfo.segment.marketPrice 
                : priceInfo.segment.governmentPrice
            )} VNĐ/m²
          </h2>
        </div>
      )}
      
      {loading && (
        <div className="loading-overlay">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default MapPage; 