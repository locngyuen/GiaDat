const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const path = require('path');

// Cấu hình
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Kết nối database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Đã kết nối với MongoDB'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/streets', require('./routes/streets'));
app.use('/api/data', require('./routes/data'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/coordinate', require('./routes/coordinate'));

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
}); 