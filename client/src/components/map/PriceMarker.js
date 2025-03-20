import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatCurrency } from '../../utils/format';

const PriceMarker = ({ position, street, segment }) => {
  // Tạo icon hiển thị giá
  const priceIcon = L.divIcon({
    className: 'price-marker',
    html: `<div class="price-bubble">${formatCurrency(segment.marketPrice)}</div>`,
    iconSize: [80, 40]
  });

  return (
    <Marker position={position} icon={priceIcon}>
      <Popup>
        <div className="price-popup">
          <h3>{street}</h3>
          <p>
            {segment.isFullStreet 
              ? 'Trọn đường' 
              : `Từ ${segment.from} đến ${segment.to}`}
          </p>
          <h4>Giá thị trường: {formatCurrency(segment.marketPrice)} VNĐ/m²</h4>
          <h4>Giá nhà nước: {formatCurrency(segment.governmentPrice)} VNĐ/m²</h4>
        </div>
      </Popup>
    </Marker>
  );
};

export default PriceMarker; 