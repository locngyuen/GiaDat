import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { formatCurrency } from '../../utils/format';

const StreetSegment = ({ street, segment, isSelected }) => {
  // Chuyển đổi tọa độ từ [lng, lat] sang [lat, lng] cho Leaflet
  const positions = segment.coordinates.coordinates.map(coord => [coord[1], coord[0]]);
  
  // Màu sắc dựa trên giá đất
  const getColorByPrice = (price) => {
    if (price < 10000000) return '#4CAF50'; // Xanh lá - giá thấp
    if (price < 30000000) return '#FFC107'; // Vàng - giá trung bình
    if (price < 50000000) return '#FF9800'; // Cam - giá cao
    return '#F44336'; // Đỏ - giá rất cao
  };
  
  const color = getColorByPrice(segment.price);
  
  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: color,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1 : 0.7
      }}
    >
      <Tooltip sticky>
        <div>
          <h4>{street.name}</h4>
          <p>
            {segment.isFullStreet 
              ? 'Trọn đường' 
              : `Từ ${segment.from} đến ${segment.to}`}
          </p>
          <p><strong>Giá: {formatCurrency(segment.price)} VNĐ/m²</strong></p>
        </div>
      </Tooltip>
    </Polyline>
  );
};

export default StreetSegment; 