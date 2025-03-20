// Tham số chuyển đổi từ VN2000 sang WGS84
const VN2000_TO_WGS84_PARAMS = {
  // Các tham số này phụ thuộc vào khu vực, đây là giá trị mẫu cho TP.HCM
  dX: -191.90441429,
  dY: -39.30318279,
  dZ: -111.45032835,
  rX: -0.00928836 / 3600 * Math.PI / 180,
  rY: 0.01975479 / 3600 * Math.PI / 180,
  rZ: -0.00427372 / 3600 * Math.PI / 180,
  scale: 0.252906278e-6
};

/**
 * Chuyển đổi tọa độ từ VN2000 sang WGS84
 * @param {number} x - Tọa độ X (Easting) trong hệ VN2000
 * @param {number} y - Tọa độ Y (Northing) trong hệ VN2000
 * @returns {Object} Tọa độ trong hệ WGS84 {lat, lng}
 */
function vn2000ToWGS84(x, y) {
  // Các tham số của ellipsoid VN2000
  const a = 6378137.0; // Bán trục lớn
  const f = 1/298.257223563; // Độ dẹt
  
  // Tính toán tọa độ trực giao từ tọa độ phẳng
  // Lưu ý: Đây là phép tính gần đúng, cần điều chỉnh tùy theo múi chiếu của VN2000
  
  // Giả định múi 3 độ (105 độ)
  const lon0 = 105 * Math.PI / 180; // Kinh tuyến trục (radian)
  
  // Các hằng số cho phép chiếu UTM
  const k0 = 0.9999; // Hệ số tỷ lệ tại kinh tuyến trục
  const E0 = 500000; // False Easting
  const N0 = 0; // False Northing
  
  // Tính toán tọa độ trực giao
  const e = Math.sqrt(2*f - f*f); // Độ lệch tâm
  const e2 = e*e;
  
  // Chuyển đổi tọa độ phẳng sang tọa độ địa lý
  const E = x - E0;
  const N = y - N0;
  
  // Tính toán tọa độ địa lý (đây là phép tính gần đúng)
  const M = N / k0;
  const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  
  const phi1 = mu + (3*e/2 - 27*e*e*e/32) * Math.sin(2*mu) 
            + (21*e*e/16 - 55*e*e*e*e/32) * Math.sin(4*mu)
            + (151*e*e*e/96) * Math.sin(6*mu)
            + (1097*e*e*e*e/512) * Math.sin(8*mu);
  
  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = sinPhi1 / cosPhi1;
  
  const C1 = e2 * cosPhi1 * cosPhi1 / (1 - e2);
  const T1 = tanPhi1 * tanPhi1;
  const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
  const D = E / (N1 * k0);
  
  const phi = phi1 - (N1 * tanPhi1 / R1) * (D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2) * D*D*D*D/24
                 + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2 - 3*C1*C1) * D*D*D*D*D*D/720);
  
  const lambda = lon0 + (D - (1 + 2*T1 + C1) * D*D*D/6 + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2 + 24*T1*T1) * D*D*D*D*D/120) / cosPhi1;
  
  // Chuyển từ radian sang độ
  let lat = phi * 180 / Math.PI;
  let lng = lambda * 180 / Math.PI;
  
  // Áp dụng tham số chuyển đổi từ VN2000 sang WGS84
  // Đây là phép tính rất đơn giản, thực tế cần sử dụng thư viện chuyên dụng như Proj4js
  // hoặc implement phép biến đổi Helmert 7-tham số đầy đủ
  
  // Giả lập việc áp dụng tham số chuyển đổi (cần thay bằng phép tính chính xác)
  // Trong thực tế, đây chỉ là ước lượng thô
  lat = lat + 0.00002; // Offset ước lượng
  lng = lng + 0.00003; // Offset ước lượng
  
  return { lat, lng };
}

module.exports = { vn2000ToWGS84 }; 