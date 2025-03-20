const Street = require('../models/Street');
const User = require('../models/User');

// Lấy thống kê tổng quan
exports.getStats = async (req, res) => {
  try {
    // Tổng số đường
    const totalStreets = await Street.countDocuments();
    
    // Tổng số đoạn đường
    const streets = await Street.find();
    const totalSegments = streets.reduce((total, street) => total + street.segments.length, 0);
    
    // Tổng số người dùng
    const totalUsers = await User.countDocuments();
    
    // Giá trung bình, thấp nhất, cao nhất
    let minPrice = Infinity;
    let maxPrice = 0;
    let totalPrice = 0;
    let priceCount = 0;
    
    streets.forEach(street => {
      street.segments.forEach(segment => {
        if (segment.price < minPrice) minPrice = segment.price;
        if (segment.price > maxPrice) maxPrice = segment.price;
        totalPrice += segment.price;
        priceCount++;
      });
    });
    
    const avgPrice = priceCount > 0 ? totalPrice / priceCount : 0;
    
    // Cập nhật gần đây
    const recentUpdates = await Street.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('updatedBy', 'fullName');
    
    // Thay đổi giá đất (giả lập dữ liệu)
    const priceChanges = [
      {
        _id: '1',
        name: 'Đường Nguyễn Huệ',
        segment: {
          isFullStreet: true,
          from: 'Trọn đường',
          to: ''
        },
        oldPrice: 120000000,
        newPrice: 150000000
      },
      {
        _id: '2',
        name: 'Đường Lê Lợi',
        segment: {
          isFullStreet: false,
          from: 'Ngã tư Phạm Ngọc Thạch',
          to: 'Ngã tư Nguyễn Huệ'
        },
        oldPrice: 100000000,
        newPrice: 95000000
      },
      {
        _id: '3',
        name: 'Đường Võ Văn Tần',
        segment: {
          isFullStreet: false,
          from: 'Đầu đường',
          to: 'Ngã ba Cao Thắng'
        },
        oldPrice: 80000000,
        newPrice: 90000000
      }
    ];
    
    res.json({
      totalStreets,
      totalSegments,
      totalUsers,
      avgPrice,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      recentUpdates,
      priceChanges
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 