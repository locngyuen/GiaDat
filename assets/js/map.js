document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo các biến toàn cục
  let map, markers, clickMarker;
  let markerVisible = true;
  let marker;
  let streets = [];
  let hoveredPoint = null;
  let selectedStreet = null;
  let spatialIndex = null;
  let landDataHienHanh = {}; // Thêm biến này
  let landDataNhaNuoc = {}; // Thêm biến này
  let vn2000Markers = L.layerGroup(); // Layer group cho markers VN2000

  // Biến để lưu marker tọa độ
  let coordinateMarker = null;

  // Khởi tạo bản đồ
  map = L.map("map").setView([10.7769, 106.7009], 17); // Tọa độ TP.HCM
  markers = L.layerGroup().addTo(map);

  // Thêm layer OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Phần tử DOM
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchResults = document.getElementById("search-results");
  const toggleMarkersBtn = document.getElementById("toggle-markers");
  const locationInfo = document.getElementById("location-info");
  const coordinateInfo = document.getElementById("coordinate-info");
  const streetInfo = document.getElementById("street-info");
  const loadingOverlay = document.getElementById("loading-overlay");

  // Build spatial index for faster searching
  function buildSpatialIndex(data) {
    const index = {};
    const gridSize = 0.001; // Khoảng 100m

    for (const district in data) {
      data[district].forEach((street) => {
        if (street["ĐOẠN ĐƯỜNG"] === "TRỌN ĐƯỜNG") {
          if (street.latitude && street.longitude) {
            const key = getGridKey(street.latitude, street.longitude, gridSize);
            if (!index[key]) index[key] = [];
            index[key].push(street);
          }
        } else {
          if (street.from_latitude && street.to_latitude) {
            // Add both endpoints and middle points
            const points = [
              [street.from_latitude, street.from_longitude],
              [street.to_latitude, street.to_longitude],
              [
                (street.from_latitude + street.to_latitude) / 2,
                (street.from_longitude + street.to_longitude) / 2,
              ],
            ];

            points.forEach(([lat, lng]) => {
              const key = getGridKey(lat, lng, gridSize);
              if (!index[key]) index[key] = [];
              if (!index[key].includes(street)) index[key].push(street);
            });
          }
        }
      });
    }
    return index;
  }

  function getGridKey(lat, lng, size) {
    return `${Math.floor(lat / size)},${Math.floor(lng / size)}`;
  }

  // Xử lý click trên bản đồ
  map.on("click", function (e) {
    if (clickMarker) {
      map.removeLayer(clickMarker);
    }

    // Tạo marker mới tại vị trí click
    clickMarker = L.marker(e.latlng, {
      icon: L.icon({
        iconUrl: "assets/img/map-marker-512.webp",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      }),
    }).addTo(map);

    // Sử dụng OpenStreetMap Nominatim API với proxy
    const proxyUrl = "https://api.allorigins.win/get?url=";
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`;
    const encodedUrl = encodeURIComponent(nominatimUrl);

    fetch(proxyUrl + encodedUrl)
      .then((response) => response.json())
      .then((data) => {
        try {
          const addressData = JSON.parse(data.contents);
          updateLocationInfo(e.latlng, addressData);
        } catch (error) {
          console.error("Error parsing address data:", error);
          updateLocationInfo(e.latlng);
        }
      })
      .catch((error) => {
        console.error("Error fetching address:", error);
        updateLocationInfo(e.latlng);
      });
  });

  function updateLocationInfo(
    latlng,
    nominatimResult = null,
    directStreetInfo = null
  ) {
    const nearestStreet =
      directStreetInfo || findNearestStreet(latlng.lat, latlng.lng);

    // Thêm nút đóng vào HTML
    coordinateInfo.innerHTML = `
        <div class="location-header">
            <strong>Thông tin địa điểm</strong>
            <button class="close-btn" onclick="toggleLocationInfo()">×</button>
        </div>
        <strong>Tọa độ:</strong><br>
        Vĩ độ: ${latlng.lat.toFixed(6)}<br>
        Kinh độ: ${latlng.lng.toFixed(6)}<br>
        <strong>Địa chỉ:</strong><br>
        ${nominatimResult ? formatNominatimAddress(nominatimResult) : getAddressFromNearestStreet(nearestStreet)}
    `;

    if (nearestStreet) {
      streetInfo.innerHTML = `
        <strong>Thông tin đường:</strong><br>
        ${nearestStreet.name}<br>
        ${
          nearestStreet.segment
            ? `<strong>Đoạn:</strong> ${nearestStreet.segment}<br>`
            : ""
        }
        <strong>Giá đất:</strong> ${nearestStreet.price} triệu đồng/m²<br>
        <strong>Quận:</strong> ${nearestStreet.district}
      `;
    } else {
      streetInfo.innerHTML = "Không tìm thấy thông tin đường gần đây";
    }

    locationInfo.classList.remove("d-none");
  }

  // Sửa lại hàm toggle để có thể bật/tắt
  function toggleLocationInfo(show) {
    // Nếu không truyền tham số show, thì sẽ toggle trạng thái hiện tại
    if (typeof show === 'undefined') {
        locationInfo.classList.toggle("d-none");
    } else {
        if (show) {
            locationInfo.classList.remove("d-none");
        } else {
            locationInfo.classList.add("d-none");
        }
    }
  }

  // Thêm vào window để có thể gọi từ HTML
  window.toggleLocationInfo = toggleLocationInfo;

  // Thêm nút hiển thị lại thông tin
  function addShowInfoButton() {
    if (document.getElementById('showInfoButton')) return;

    const button = document.createElement('button');
    button.id = 'showInfoButton';
    button.className = 'show-info-btn';
    button.innerHTML = '<i class="fas fa-info-circle"></i>';
    button.onclick = () => toggleLocationInfo(true);
    document.body.appendChild(button);
  }

  // Thêm event listener cho nút đóng
  document.addEventListener('DOMContentLoaded', function() {
    // Thêm nút hiển thị thông tin
    addShowInfoButton();
  });

  function formatNominatimAddress(result) {
    if (!result || !result.address) return "Không xác định";

    const addr = result.address;
    const parts = [];

    if (addr.road) parts.push(addr.road);
    if (addr.suburb) parts.push(addr.suburb);
    if (addr.quarter) parts.push(addr.quarter);
    if (addr.city_district) parts.push(addr.city_district);
    if (addr.city) parts.push(addr.city);

    if (addr.road) {
      const roadInfo = findRoadPriceByName(
        addr.road,
        addr.city_district || addr.suburb
      );
      if (roadInfo) {
        setTimeout(() => {
          streetInfo.innerHTML = `
            <strong>Thông tin giá đất:</strong><br>
            <strong>Đường:</strong> ${roadInfo.name}<br>
            ${
              roadInfo.segment
                ? `<strong>Đoạn:</strong> ${roadInfo.segment}`
                : ""
            }<br>
            <strong>Giá đất:</strong> ${roadInfo.price} triệu đồng/m²<br>
            <strong>Quận:</strong> ${roadInfo.district}
          `;
        }, 100);
      }
    }

    return parts.length > 0 ? parts.join(", ") : result.display_name;
  }

  // Tìm thông tin giá đất dựa vào tên đường
  function findRoadPriceByName(roadName, district) {
    // Chuẩn hóa tên đường để so sánh
    const normalizedRoadName = normalizeRoadName(roadName);
    let bestMatch = null;
    let bestMatchScore = 0;
    let bestMatchDistrict = null;

    // Tìm trong tất cả các quận
    for (const d in dataHienHanh) {
      dataHienHanh[d].forEach((street) => {
        const streetName = normalizeRoadName(street["TÊN ĐƯỜNG"]);

        // Tính điểm tương đồng giữa tên đường
        const similarityScore = calculateSimilarity(
          normalizedRoadName,
          streetName
        );

        // Nếu tìm thấy đường có tên tương tự và điểm cao hơn
        if (similarityScore > 0.7 && similarityScore > bestMatchScore) {
          bestMatchScore = similarityScore;
          bestMatch = street;
          bestMatchDistrict = d;
        }
      });
    }

    // Nếu tìm thấy kết quả phù hợp
    if (bestMatch) {
      return {
        name: bestMatch["TÊN ĐƯỜNG"],
        segment:
          bestMatch["ĐOẠN ĐƯỜNG"] !== "TRỌN ĐƯỜNG"
            ? `${bestMatch["ĐOẠN ĐƯỜNG"]} - ${bestMatch["Unnamed: 3"] || ""}`
            : null,
        price: (bestMatch["GIÁ ĐẤT"] / 100).toLocaleString("vi-VN", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        district: bestMatchDistrict,
      };
    }

    return null;
  }

  // Chuẩn hóa tên đường để so sánh
  function normalizeRoadName(name) {
    if (!name) return "";

    // Chuyển về chữ thường, bỏ dấu
    let normalized = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Loại bỏ các từ không cần thiết
    normalized = normalized
      .replace(/^duong\s+/i, "") // Bỏ từ "đường" ở đầu
      .replace(/\s+/g, " ") // Chuẩn hóa khoảng trắng
      .trim();

    return normalized;
  }

  // Tính độ tương đồng giữa hai chuỗi (0-1)
  function calculateSimilarity(str1, str2) {
    // Sử dụng thuật toán Levenshtein distance
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    // Kiểm tra nếu chuỗi ngắn hơn là một phần của chuỗi dài hơn
    if (longer.includes(shorter)) return 0.9;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / parseFloat(longer.length);
  }

  // Thuật toán Levenshtein distance
  function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;

    // Tạo ma trận
    const d = Array(m + 1)
      .fill()
      .map(() => Array(n + 1).fill(0));

    // Khởi tạo
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;

    // Tính toán
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= m; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1, // Xóa
          d[i][j - 1] + 1, // Chèn
          d[i - 1][j - 1] + cost // Thay thế
        );
      }
    }

    return d[m][n];
  }

  function getAddressFromNearestStreet(street) {
    if (!street) return "Không xác định";

    let address = [];
    if (street.name) address.push(street.name);
    if (street.district) address.push(street.district);
    address.push("TP. Hồ Chí Minh");

    return address.join(", ");
  }

  function findNearestStreet(lat, lng) {
    const nearbyStreets = getNearbyStreets(lat, lng);
    let nearestStreet = null;
    let minDistance = Infinity;
    let district = null;

    nearbyStreets.forEach((street) => {
      let distance;

      if (street["ĐOẠN ĐƯỜNG"] === "TRỌN ĐƯỜNG") {
        if (street.latitude && street.longitude) {
          distance = getDistance(lat, lng, street.latitude, street.longitude);
        }
      } else {
        if (street.from_latitude && street.to_latitude) {
          distance = getDistanceToLineSegment(
            lat,
            lng,
            street.from_latitude,
            street.from_longitude,
            street.to_latitude,
            street.to_longitude
          );
        }
      }

      if (distance && distance < minDistance) {
        minDistance = distance;
        // Find district for this street
        for (const d in dataHienHanh) {
          if (dataHienHanh[d].includes(street)) {
            district = d;
            break;
          }
        }

        nearestStreet = {
          name: street["TÊN ĐƯỜNG"],
          segment:
            street["ĐOẠN ĐƯỜNG"] !== "TRỌN ĐƯỜNG"
              ? `${street["ĐOẠN ĐƯỜNG"]} - ${street["Unnamed: 3"]}`
              : null,
          price: (street["GIÁ ĐẤT"] / 100).toLocaleString("vi-VN", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }),
          district: district,
        };
      }
    });

    return minDistance < 0.001 ? nearestStreet : null;
  }

  function getNearbyStreets(lat, lng) {
    const gridSize = 0.001;
    const key = getGridKey(lat, lng, gridSize);
    const streets = new Set();

    // Check current grid and adjacent grids
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const adjacentKey = `${Math.floor(lat / gridSize) + i},${
          Math.floor(lng / gridSize) + j
        }`;
        if (spatialIndex[adjacentKey]) {
          spatialIndex[adjacentKey].forEach((street) => streets.add(street));
        }
      }
    }

    return Array.from(streets);
  }

  // Helper functions
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function getDistanceToLineSegment(lat, lng, lat1, lng1, lat2, lng2) {
    const A = lat - lat1;
    const B = lng - lng1;
    const C = lat2 - lat1;
    const D = lng2 - lng1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lat1;
      yy = lng1;
    } else if (param > 1) {
      xx = lat2;
      yy = lng2;
    } else {
      xx = lat1 + param * C;
      yy = lng1 + param * D;
    }

    return getDistance(lat, lng, xx, yy);
  }

  // Thêm hàm tạo custom icon dựa trên giá đất
  function createPriceIcon(price) {
    const color = getColorByPrice(price);
    return L.divIcon({
      className: "price-marker",
      html: `<div class="marker-icon" style="background-color: ${color}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  // Cập nhật hàm displayLandPrices
  function displayLandPrices(data) {
    for (const district in data) {
      const roads = data[district];
      roads.forEach(function (item) {
        const roadName = item["TÊN ĐƯỜNG"];
        const price = item["GIÁ ĐẤT"];
        const segment = item["ĐOẠN ĐƯỜNG"];
        const to = item["Unnamed: 3"];

        const formattedPrice = (price / 100).toLocaleString("vi-VN", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

        if (segment === "TRỌN ĐƯỜNG") {
          const latitude = item["latitude"];
          const longitude = item["longitude"];
          if (latitude && longitude) {
            const marker = L.marker([latitude, longitude], {
              icon: createPriceIcon(price),
            }).addTo(markers);

            marker.on("click", function () {
              if (clickMarker) map.removeLayer(clickMarker);
              updateLocationInfo({ lat: latitude, lng: longitude }, null, {
                name: roadName,
                segment: null,
                price: formattedPrice,
                district: district,
              });
            });
          }
        } else if (segment !== "TRỌN ĐƯỜNG" && to) {
          const from_latitude = item["from_latitude"];
          const from_longitude = item["from_longitude"];
          const to_latitude = item["to_latitude"];
          const to_longitude = item["to_longitude"];

          if (from_latitude && from_longitude && to_latitude && to_longitude) {
            const markerFrom = L.marker([from_latitude, from_longitude], {
              icon: createPriceIcon(price),
            }).addTo(markers);

            const markerTo = L.marker([to_latitude, to_longitude], {
              icon: createPriceIcon(price),
            }).addTo(markers);

            const streetInfo = {
              name: roadName,
              segment: `${segment} - ${to}`,
              price: formattedPrice,
              district: district,
            };

            markerFrom.on("click", function () {
              if (clickMarker) map.removeLayer(clickMarker);
              updateLocationInfo(
                { lat: from_latitude, lng: from_longitude },
                null,
                streetInfo
              );
            });

            markerTo.on("click", function () {
              if (clickMarker) map.removeLayer(clickMarker);
              updateLocationInfo(
                { lat: to_latitude, lng: to_longitude },
                null,
                streetInfo
              );
            });
          }
        }
      });
    }
  }

  // Tải dữ liệu và hiển thị
  function loadAndDisplayData() {
    showLoading();
    try {
      displayLandPrices(dataHienHanh);
      spatialIndex = buildSpatialIndex(dataHienHanh);
      hideLoading();
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      hideLoading();
    }
  }

  function showLoading() {
    loadingOverlay.classList.remove("d-none");
  }

  function hideLoading() {
    loadingOverlay.classList.add("d-none");
  }

  // Định dạng số thành tiền tệ
  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN").format(value);
  }

  // Lấy dữ liệu đường phố từ file JSON
  async function fetchStreets() {
    showLoading();

    try {
      const response = await fetch("data/streets.json");
      const data = await response.json();
      streets = data;

      // Hiển thị đường phố lên bản đồ
      renderStreets();
    } catch (error) {
      console.error("Lỗi lấy dữ liệu đường phố:", error);
      alert("Không thể tải dữ liệu đường phố. Vui lòng thử lại sau.");
    } finally {
      hideLoading();
    }
  }

  // Hiển thị đường phố lên bản đồ
  function renderStreets() {
    streets.forEach((street) => {
      street.segments.forEach((segment, index) => {
        if (segment.coordinates && segment.coordinates.coordinates) {
          // Chuyển đổi tọa độ từ [lng, lat] sang [lat, lng] cho Leaflet
          const positions = segment.coordinates.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]);

          // Màu sắc dựa trên giá đất
          const color = getColorByPrice(segment.price);

          // Tạo polyline
          const polyline = L.polyline(positions, {
            color: color,
            weight: 4,
            opacity: 0.7,
            className: "street-polyline",
          }).addTo(map);

          // Thêm tooltip
          polyline.bindTooltip(
            `
            <div class="street-tooltip">
              <h5>${street.name}</h5>
              <p>
                ${
                  segment.isFullStreet
                    ? "Trọn đường"
                    : `Từ ${segment.from} đến ${segment.to}`
                }
              </p>
              <p><strong>Giá: ${formatCurrency(
                segment.price
              )} VNĐ/m²</strong></p>
            </div>
          `,
            { sticky: true }
          );

          // Sự kiện click
          polyline.on("click", function () {
            selectedStreet = street;

            // Lấy tọa độ trung tâm của đoạn đường
            const coords = segment.coordinates.coordinates;
            if (coords && coords.length > 0) {
              const midIndex = Math.floor(coords.length / 2);
              map.setView([coords[midIndex][1], coords[midIndex][0]], 16);
            }

            // Hiển thị thông tin
            showPriceInfo(street.name, segment);
          });
        }
      });
    });
  }

  // Hiển thị thông tin giá đất
  function showPriceInfo(name, segment) {
    streetInfo.innerHTML = `
      <strong>Đường:</strong><br>
      ${name}<br>
      ${
        segment.isFullStreet
          ? "Trọn đường"
          : `Từ ${segment.from} đến ${segment.to}`
      }<br>
      <strong>Giá đất:</strong> ${formatCurrency(segment.price)} VNĐ/m²
    `;

    locationInfo.classList.remove("d-none");
  }

  // Ẩn thông tin giá đất
  function hidePriceInfo() {
    locationInfo.classList.add("d-none");
  }

  // Màu sắc dựa trên giá đất
  function getColorByPrice(price) {
    if (price < 10000000) return "#4CAF50"; // Xanh lá - giá thấp
    if (price < 30000000) return "#FFC107"; // Vàng - giá trung bình
    if (price < 50000000) return "#FF9800"; // Cam - giá cao
    return "#F44336"; // Đỏ - giá rất cao
  }

  // Tìm kiếm đường phố
  function searchStreets(query) {
    if (!query.trim()) return [];

    query = query.toLowerCase();

    return streets.filter((street) => {
      // Tìm trong tên đường
      if (street.name.toLowerCase().includes(query)) return true;

      // Tìm trong đoạn đường
      for (const segment of street.segments) {
        if (
          (segment.from && segment.from.toLowerCase().includes(query)) ||
          (segment.to && segment.to.toLowerCase().includes(query))
        ) {
          return true;
        }
      }

      return false;
    });
  }

  // Hiển thị kết quả tìm kiếm
  function renderSearchResults(results) {
    searchResults.innerHTML = "";

    if (results.length === 0) {
      searchResults.style.display = "none";
      return;
    }

    results.forEach((result) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
        <strong>${result.name}</strong>
        <p>${result.district || ""}</p>
      `;

      item.addEventListener("click", function () {
        selectStreet(result);
        searchResults.style.display = "none";
        searchInput.value = result.name;
      });

      searchResults.appendChild(item);
    });

    searchResults.style.display = "block";
  }

  // Chọn đường phố
  function selectStreet(street) {
    selectedStreet = street;

    // Lấy tọa độ trung tâm của đoạn đường đầu tiên
    if (
      street.segments &&
      street.segments.length > 0 &&
      street.segments[0].coordinates
    ) {
      const coords = street.segments[0].coordinates.coordinates;
      if (coords && coords.length > 0) {
        const midIndex = Math.floor(coords.length / 2);
        map.setView([coords[midIndex][1], coords[midIndex][0]], 16);
      }
    }

    // Hiển thị thông tin
    if (street.segments && street.segments.length > 0) {
      showPriceInfo(street.name, street.segments[0]);
    }
  }

  // Tìm giá đất tại vị trí con trỏ
  function findPriceAtPoint() {
    if (!hoveredPoint || streets.length === 0) return null;

    // Tìm đoạn đường gần nhất
    let closestSegment = null;
    let minDistance = Infinity;

    streets.forEach((street) => {
      street.segments.forEach((segment) => {
        if (segment.coordinates && segment.coordinates.coordinates) {
          const coords = segment.coordinates.coordinates;

          // Tính khoảng cách từ điểm đến đoạn đường
          for (let i = 0; i < coords.length - 1; i++) {
            const p1 = L.latLng(coords[i][1], coords[i][0]);
            const p2 = L.latLng(coords[i + 1][1], coords[i + 1][0]);
            const point = L.latLng(hoveredPoint.lat, hoveredPoint.lng);

            const distance = L.GeometryUtil.distanceSegment(map, point, p1, p2);

            if (distance < minDistance && distance < 50) {
              // Trong phạm vi 50m
              minDistance = distance;
              closestSegment = {
                street: street.name,
                segment: segment,
                distance,
              };
            }
          }
        }
      });
    });

    return closestSegment;
  }

  // Hàm kiểm tra tọa độ hợp lệ
  function isValidCoordinate(lat, lng) {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  // Hàm xử lý tìm kiếm theo tọa độ
  function searchByCoordinates() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);

    if (!isValidCoordinate(lat, lng)) {
        alert('Vui lòng nhập tọa độ hợp lệ!\nVĩ độ: -90 đến 90\nKinh độ: -180 đến 180');
        return;
    }

    // Xóa marker cũ nếu có
    if (clickMarker) {
        map.removeLayer(clickMarker);
    }

    // Tạo marker mới tại vị trí tọa độ
    clickMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: "assets/img/map-marker-512.webp",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
        }),
    }).addTo(map);

    // Di chuyển map đến vị trí tọa độ
    map.setView([lat, lng], 17);

    // Tìm thông tin địa điểm tại tọa độ
    const proxyUrl = "https://api.allorigins.win/get?url=";
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const encodedUrl = encodeURIComponent(nominatimUrl);

    fetch(proxyUrl + encodedUrl)
        .then(response => response.json())
        .then(data => {
            try {
                const addressData = JSON.parse(data.contents);
                updateLocationInfo({lat: lat, lng: lng}, addressData);
            } catch (error) {
                console.error("Error parsing address data:", error);
                updateLocationInfo({lat: lat, lng: lng});
            }
        })
        .catch(error => {
            console.error("Error fetching address:", error);
            updateLocationInfo({lat: lat, lng: lng});
        });
  }

  // Thêm event listener cho nút tìm kiếm tọa độ
  document.getElementById('searchCoordinates').addEventListener('click', searchByCoordinates);

  // Thêm xử lý nhập bằng phím Enter
  document.getElementById('latitude').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('longitude').focus();
    }
  });

  document.getElementById('longitude').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchByCoordinates();
    }
  });

  // Sự kiện di chuyển chuột trên bản đồ
  map.on("mousemove", function (e) {
    hoveredPoint = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    };

    // Tìm giá đất tại vị trí con trỏ
    const priceInfo = findPriceAtPoint();

    if (priceInfo) {
      showPriceInfo(priceInfo.street, priceInfo.segment);
    }
  });

  // Tải dữ liệu khi trang được tải
  loadAndDisplayData();

  // 🟢 Tải dữ liệu JSON từ Flask API
  async function loadLandData() {
    try {
      const response1 = await fetch("/data/Bang_gia_dat.json");
      const response2 = await fetch("/data/Bang_gia_dat_nha_nuoc.json");

      if (!response1.ok || !response2.ok) {
        throw new Error("Không thể tải dữ liệu!");
      }

      landDataHienHanh = await response1.json();
      landDataNhaNuoc = await response2.json();
    } catch (error) {
      alert(error.message);
    }
  }

  // 🟢 Ẩn/Hiện nhập điểm đầu/cuối
  function toggleSearchMode() {
    const searchType = document.getElementById("searchType").value;
    const customFields = document.getElementById("customSearchFields");

    if (searchType === "custom") {
      customFields.style.display = "block";
      document.getElementById("startPoint").disabled = false;
      document.getElementById("endPoint").disabled = false;
    } else {
      customFields.style.display = "none";
      document.getElementById("startPoint").disabled = true;
      document.getElementById("endPoint").disabled = true;
    }
  }

  // 🟢 Ẩn bảng tra cứu khi có kết quả
  function hideSearchPanel() {
    document.querySelector(".controls").style.display = "none";
    document.getElementById("showSearchPanel").style.display = "block";
  }

  // 🟢 Hiện lại bảng tra cứu khi bấm nút
  function showSearchPanel() {
    document.querySelector(".controls").style.display = "block";
    document.getElementById("showSearchPanel").style.display = "none";
  }

  // Khởi tạo sự kiện cho bảng tìm kiếm tích hợp
  function initSearchPanel() {
    // Xử lý chuyển đổi mode tìm kiếm
    const searchModeSelect = document.getElementById('searchModeSelect');
    if (searchModeSelect) {
      searchModeSelect.addEventListener('change', function() {
        const mode = this.value;
        console.log("Search mode changed to:", mode);
        if (mode === 'street') {
          document.getElementById('streetSearch').style.display = 'block';
          document.getElementById('coordinateSearch').style.display = 'none';
        } else if (mode === 'coordinate') {
          document.getElementById('streetSearch').style.display = 'none';
          document.getElementById('coordinateSearch').style.display = 'block';
        }
      });
    }
    
    // Xử lý radio buttons cho loại tìm kiếm đường
    const fullRoadRadio = document.getElementById('fullRoad');
    const customRoadRadio = document.getElementById('customRoad');
    const customFields = document.getElementById('customSearchFields');
    
    if (fullRoadRadio && customRoadRadio && customFields) {
      fullRoadRadio.addEventListener('change', function() {
        if (this.checked) {
          customFields.style.display = 'none';
        }
      });
      
      customRoadRadio.addEventListener('change', function() {
        if (this.checked) {
          customFields.style.display = 'block';
        }
      });
    }
    
    // Ẩn/hiện bảng tìm kiếm
    const toggleButton = document.getElementById('toggleSearch');
    const closeButton = document.getElementById('closeSearch');
    const searchPanel = document.querySelector('.integrated-search');
    
    if (toggleButton) {
      toggleButton.addEventListener('click', function() {
        if (searchPanel.classList.contains('active')) {
          searchPanel.classList.remove('active');
        } else {
          searchPanel.classList.add('active');
        }
      });
    }
    
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        searchPanel.classList.remove('active');
      });
    }
    
    // Xử lý phím Enter trong các trường nhập
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
      searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchByAddress();
        }
      });
    }
    
    const latitude = document.getElementById('latitude');
    if (latitude) {
      latitude.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          document.getElementById('longitude').focus();
        }
      });
    }
    
    const longitude = document.getElementById('longitude');
    if (longitude) {
      longitude.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchByCoordinates();
        }
      });
    }
    
    // Xử lý hiện thị mặc định
    if (searchPanel && !searchPanel.classList.contains('active')) {
      searchPanel.classList.add('active');
    }
    
    // Thêm event listener cho nút tìm kiếm
    const searchAddressBtn = document.getElementById('searchAddress');
    if (searchAddressBtn) {
      searchAddressBtn.addEventListener('click', searchByAddress);
    }
    
    const searchCoordinatesBtn = document.getElementById('searchCoordinates');
    if (searchCoordinatesBtn) {
      searchCoordinatesBtn.addEventListener('click', searchByCoordinates);
    }
  }

  // 🟢 Sửa lại hàm searchByAddress để xử lý radio buttons
  async function searchByAddress() {
    const district = document.getElementById("districtSelect").value;
    const streetName = document.getElementById("searchBox").value.trim();
    const isFullRoad = document.getElementById('fullRoad').checked;

    // Nếu là tìm kiếm theo đoạn đường, lấy thêm thông tin đoạn
    let startPoint = '';
    let endPoint = '';
    if (!isFullRoad) {
      startPoint = document.getElementById('startPoint').value.trim();
      endPoint = document.getElementById('endPoint').value.trim();
      
      if (!startPoint || !endPoint) {
        alert('Vui lòng nhập điểm đầu và điểm cuối!');
        return;
      }
    }

    let priceHienHanh = "Không có dữ liệu";
    let priceNhaNuoc = "Không có dữ liệu";

    // Kiểm tra input
    if (!district || !streetName) {
      alert("Vui lòng chọn quận và nhập tên đường!");
      return;
    }

    try {
      // Tìm tất cả các đoạn đường của tên đường đã chọn
      const streetSegmentsHienHanh = landDataHienHanh[district]?.filter(
        (street) =>
          street["TÊN ĐƯỜNG"].toLowerCase() === streetName.toLowerCase()
      );

      const streetSegmentsNhaNuoc = landDataNhaNuoc[district]?.filter(
        (street) =>
          street["TÊN ĐƯỜNG"].toLowerCase() === streetName.toLowerCase()
      );

      if (!streetSegmentsHienHanh?.length && !streetSegmentsNhaNuoc?.length) {
        alert("Không tìm thấy thông tin đường này!");
        return;
      }

      // Tạo popup content với tất cả các đoạn đường
      let popupContent = `
        <div class="price-popup">
          <h6>${streetName}</h6>
          <p><b>Quận:</b> ${district}</p>
          <div class="segments-list">
      `;

      // Hàm định dạng giá tiền
      function formatPrice(price) {
        return (price / 1000).toLocaleString("vi-VN", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
      }

      // Sửa phần hiển thị giá trong popup
      if (streetSegmentsHienHanh?.length) {
        popupContent += `<h7>Giá hiện hành:</h7>`;
        streetSegmentsHienHanh.forEach((segment) => {
          const roadSegment = segment["ĐOẠN ĐƯỜNG"];
          const endSegment = segment["Unnamed: 3"] || "";

          popupContent += `
            <div class="segment-item" onclick="selectSegment(this)" 
                 data-price="${formatPrice(segment["GIÁ ĐẤT"])}">
              <p><b>Đoạn đường:</b></p>
              ${
                roadSegment.toLowerCase() === "trọn đường"
                  ? `<p class="segment-details">Trọn đường</p>`
                  : `<p class="segment-details">
                      <span class="segment-start"><b>Điểm đầu:</b> ${roadSegment}</span><br>
                      <span class="segment-end"><b>Điểm cuối:</b> ${endSegment}</span>
                    </p>`
              }
              <p class="price-value"><b>Giá:</b> ${formatPrice(
                segment["GIÁ ĐẤT"]
              )} triệu đồng/m²</p>
            </div>
          `;
        });
      }

      if (streetSegmentsNhaNuoc?.length) {
        popupContent += `<h7>Giá nhà nước:</h7>`;
        streetSegmentsNhaNuoc.forEach((segment) => {
          const roadSegment = segment["ĐOẠN ĐƯỜNG"];
          const endSegment = segment["Unnamed: 3"] || "";

          popupContent += `
            <div class="segment-item" onclick="selectSegment(this)"
                 data-price="${formatPrice(segment["GIÁ ĐẤT"])}">
              <p><b>Đoạn đường:</b></p>
              ${
                roadSegment.toLowerCase() === "trọn đường"
                  ? `<p class="segment-details">Trọn đường</p>`
                  : `<p class="segment-details">
                      <span class="segment-start"><b>Điểm đầu:</b> ${roadSegment}</span><br>
                      <span class="segment-end"><b>Điểm cuối:</b> ${endSegment}</span>
                    </p>`
              }
              <p class="price-value"><b>Giá:</b> ${formatPrice(
                segment["GIÁ ĐẤT"]
              )} triệu đồng/m²</p>
            </div>
          `;
        });
      }

      popupContent += `</div></div>`;

      // Tìm vị trí trên bản đồ
      const searchQuery = `${streetName}, ${district}, Hồ Chí Minh, Vietnam`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Không thể kết nối với dịch vụ bản đồ");
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];

        // Xóa marker cũ nếu có
        if (marker) {
          map.removeLayer(marker);
        }

        // Tạo marker mới
        marker = L.marker([lat, lon])
          .addTo(map)
          .bindPopup(popupContent, {
            maxWidth: 300,
            className: "custom-popup",
          })
          .openPopup();

        map.setView([lat, lon], 16);
        hideSearchPanel();
      } else {
        throw new Error("Không tìm thấy vị trí trên bản đồ");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert(`Lỗi khi tìm kiếm: ${error.message}`);
    }
  }

  // Thêm function để xử lý khi click vào segment
  window.selectSegment = function (element) {
    // Lấy thông tin từ segment được chọn
    const segmentDetails = element.querySelector(".segment-details");
    const streetName = document.querySelector(".price-popup h6").textContent;
    const district = document
      .querySelector(".price-popup p b")
      .nextSibling.textContent.trim();

    // Highlight segment được chọn
    const popup = document.querySelector(".leaflet-popup-content");
    const segments = popup.querySelectorAll(".segment-item");
    segments.forEach((seg) => seg.classList.remove("selected"));
    element.classList.add("selected");

    // Tìm marker tương ứng trong layer group markers
    if (markerVisible && markers) {
      let found = false;
      markers.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          // Kiểm tra xem đây có phải là marker xanh không
          const icon = layer.getIcon();
          const markerDiv = icon?.options?.html;

          // Lấy thông tin đoạn đường từ element được click
          const startPoint = element
            .querySelector(".segment-start")
            ?.textContent.replace("Điểm đầu:", "")
            .trim();
          const endPoint = element
            .querySelector(".segment-end")
            ?.textContent.replace("Điểm cuối:", "")
            .trim();
          const isTronDuong = segmentDetails.textContent.includes("Trọn đường");

          // Nếu là marker xanh và thuộc về đường đang xem
          if (markerDiv?.includes("marker-icon")) {
            const markerPopup = layer.getPopup();
            if (markerPopup) {
              const content = markerPopup.getContent();
              // Kiểm tra khớp tên đường và đoạn đường
              if (
                content.includes(streetName) &&
                (isTronDuong
                  ? content.includes("Trọn đường")
                  : content.includes(startPoint) && content.includes(endPoint))
              ) {
                // Di chuyển map đến vị trí marker và mở popup
                map.setView(layer.getLatLng(), 17);
                layer.openPopup();
                found = true;
              }
            }
          }
        }
      });

      // Thông báo nếu không tìm thấy marker
      if (!found) {
        console.log("Không tìm thấy marker cho đoạn đường này");
      }
    }
  };

  loadLandData();
  document
    .getElementById("searchAddress")
    .addEventListener("click", searchByAddress);
  document
    .getElementById("searchType")
    .addEventListener("change", toggleSearchMode);
  document
    .getElementById("showSearchPanel")
    .addEventListener("click", showSearchPanel);

  // Thêm các hàm xử lý tìm kiếm
  function toggleSearchMenu() {
    const menu = document.getElementById('searchMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }

  // Đóng menu khi click ra ngoài
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('searchMenu');
    const searchBtn = document.querySelector('.search-btn');
    if (!menu.contains(e.target) && !searchBtn.contains(e.target)) {
        menu.style.display = 'none';
    }
  });

  // Chạy khi trang web được tải
  function init() {
    // Khởi tạo bảng tìm kiếm
    initSearchPanel();
    
    // Tải dữ liệu khi trang được tải
    loadAndDisplayData();
    
    // Tải dữ liệu JSON từ Flask API
    loadLandData();
  }

  // Chạy khi trang web được tải
  init();
});
