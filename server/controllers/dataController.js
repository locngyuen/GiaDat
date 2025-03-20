const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Street = require('../models/Street');

// Upload file Excel
exports.uploadExcel = async (req, res) => {
  try {
    // Kiểm tra quyền (chỉ admin và editor mới được upload)
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Không có quyền upload dữ liệu' });
    }
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'Không có file được upload' });
    }
    
    const file = req.files.file;
    
    // Kiểm tra định dạng file
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return res.status(400).json({ message: 'Chỉ chấp nhận file Excel (.xlsx, .xls)' });
    }
    
    // Lưu file
    const uploadPath = path.join(__dirname, '../../uploads', `${Date.now()}_${file.name}`);
    
    file.mv(uploadPath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi khi lưu file' });
      }
      
      res.json({
        message: 'Upload thành công',
        filePath: uploadPath,
        fileName: file.name
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xử lý và cập nhật dữ liệu từ file Excel
exports.processExcel = async (req, res) => {
  try {
    // Kiểm tra quyền (chỉ admin và editor mới được cập nhật dữ liệu)
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Không có quyền cập nhật dữ liệu' });
    }
    
    const { filePath, dataType } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ message: 'Không có đường dẫn file' });
    }
    
    if (!dataType || !['market', 'government'].includes(dataType)) {
      return res.status(400).json({ message: 'Loại dữ liệu không hợp lệ. Chọn "market" hoặc "government"' });
    }
    
    // Đọc file Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // Xử lý dữ liệu
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const row of data) {
      try {
        // Kiểm tra dữ liệu bắt buộc
        if (!row['Tên đường']) {
          throw new Error('Thiếu tên đường');
        }
        
        const streetName = row['Tên đường'];
        const price = parseFloat(row['Giá đất']);
        
        if (isNaN(price) || price <= 0) {
          throw new Error('Giá đất không hợp lệ');
        }
        
        // Kiểm tra nếu là trọn đường hay đoạn đường
        const isFullStreet = !row['Đến'] && (row['Từ'] === 'Trọn đường' || !row['Từ']);
        
        // Tìm đường trong database
        let street = await Street.findOne({ name: streetName });
        
        if (street) {
          // Cập nhật đoạn đường
          for (const segment of street.segments) {
            if ((isFullStreet && segment.isFullStreet) || 
                (!isFullStreet && segment.from === row['Từ'] && segment.to === row['Đến'])) {
              
              // Cập nhật giá tương ứng (thị trường hoặc nhà nước)
              if (dataType === 'market') {
                segment.marketPrice = price;
              } else {
                segment.governmentPrice = price;
              }
              
              // Nếu chưa có giá nào, thiết lập giá mặc định
              if (!segment.marketPrice) segment.marketPrice = price;
              if (!segment.governmentPrice) segment.governmentPrice = price;
              
              street.updatedAt = Date.now();
              street.updatedBy = req.user.id;
              
              await street.save();
              results.success++;
              break;
            }
          }
          
          // Nếu không tìm thấy segment phù hợp, tạo segment mới
          if (street.segments.every(segment => 
              (isFullStreet && !segment.isFullStreet) || 
              (!isFullStreet && (segment.from !== row['Từ'] || segment.to !== row['Đến'])))) {
            
            const segment = {
              isFullStreet,
              from: isFullStreet ? 'Trọn đường' : row['Từ'] || '',
              to: isFullStreet ? '' : row['Đến'] || '',
              coordinates: {
                type: 'LineString',
                coordinates: [[106.7, 10.77], [106.71, 10.78]] // Tọa độ mặc định
              }
            };
            
            // Thiết lập giá
            if (dataType === 'market') {
              segment.marketPrice = price;
              segment.governmentPrice = price; // Giá mặc định
            } else {
              segment.governmentPrice = price;
              segment.marketPrice = price; // Giá mặc định
            }
            
            street.segments.push(segment);
            street.updatedAt = Date.now();
            street.updatedBy = req.user.id;
            
            await street.save();
            results.success++;
          }
        } else {
          // Tạo mới đường
          const segment = {
            isFullStreet,
            from: isFullStreet ? 'Trọn đường' : row['Từ'] || '',
            to: isFullStreet ? '' : row['Đến'] || '',
            coordinates: {
              type: 'LineString',
              coordinates: [[106.7, 10.77], [106.71, 10.78]] // Tọa độ mặc định
            }
          };
          
          // Thiết lập giá
          if (dataType === 'market') {
            segment.marketPrice = price;
            segment.governmentPrice = price; // Giá mặc định
          } else {
            segment.governmentPrice = price;
            segment.marketPrice = price; // Giá mặc định
          }
          
          street = new Street({
            name: streetName,
            district: row['Quận/Huyện'] || 'Chưa xác định',
            segments: [segment],
            updatedBy: req.user.id
          });
          
          await street.save();
          results.success++;
        }
      } catch (error) {
        console.error(error);
        results.failed++;
        results.errors.push(`Lỗi xử lý dòng: ${JSON.stringify(row)} - ${error.message}`);
      }
    }
    
    // Xóa file sau khi xử lý
    fs.unlinkSync(filePath);
    
    res.json({
      message: 'Xử lý dữ liệu thành công',
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 