document.addEventListener('DOMContentLoaded', function() {
  // Kiểm tra xem đã đăng nhập chưa
  const isAuthenticated = checkAuth();
  
  // Cập nhật các nút đăng nhập/đăng xuất
  updateAuthButtons(isAuthenticated);
  
  // Kiểm tra quyền truy cập nếu ở trang admin
  checkAdminAccess();
  
  /**
   * Kiểm tra xác thực từ localStorage
   * @returns {boolean} Trạng thái đăng nhập
   */
  function checkAuth() {
    const userData = localStorage.getItem('user');
    return userData !== null;
  }
  
  /**
   * Lấy thông tin người dùng
   * @returns {object|null} Thông tin người dùng hoặc null nếu chưa đăng nhập
   */
  function getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
  
  /**
   * Cập nhật các nút đăng nhập/đăng xuất
   * @param {boolean} isAuthenticated Trạng thái đăng nhập
   */
  function updateAuthButtons(isAuthenticated) {
    const authButtonsContainer = document.getElementById('authButtons');
    
    if (!authButtonsContainer) return;
    
    if (isAuthenticated) {
      const user = getUser();
      
      let adminLink = '';
      if (user.role === 'admin' || user.role === 'editor') {
        adminLink = `
          <a href="admin/dashboard.html" class="btn btn-outline-light me-2">
            <i class="fas fa-tachometer-alt"></i> Quản trị
          </a>
        `;
      }
      
      authButtonsContainer.innerHTML = `
        ${adminLink}
        <div class="dropdown">
          <button class="btn btn-primary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
            <i class="fas fa-user"></i> ${user.fullName}
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="#" id="logoutButton"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></li>
          </ul>
        </div>
      `;
      
      // Thêm sự kiện đăng xuất
      document.getElementById('logoutButton').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
      });
    } else {
      authButtonsContainer.innerHTML = `
        <a href="login.html" class="btn btn-primary">
          <i class="fas fa-user"></i> Đăng nhập
        </a>
      `;
    }
  }
  
  /**
   * Đăng nhập
   * @param {string} username Tên đăng nhập
   * @param {string} password Mật khẩu
   * @returns {boolean} Kết quả đăng nhập
   */
  window.login = function(username, password) {
    // Trong phiên bản HTML thuần, chúng ta mô phỏng việc đăng nhập bằng dữ liệu cứng
    // Trong thực tế bạn sẽ gọi API để xác thực người dùng
    
    // Dữ liệu mẫu
    const users = [
      {
        id: '1',
        username: 'admin',
        password: 'admin123',
        fullName: 'Quản trị viên',
        role: 'admin'
      },
      {
        id: '2',
        username: 'editor',
        password: 'editor123',
        fullName: 'Biên tập viên',
        role: 'editor'
      },
      {
        id: '3',
        username: 'user',
        password: 'user123',
        fullName: 'Người dùng',
        role: 'viewer'
      }
    ];
    
    // Tìm người dùng
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Lưu thông tin người dùng vào localStorage (không lưu mật khẩu)
      const { password, ...userWithoutPassword } = user;
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      return true;
    }
    
    return false;
  };
  
  /**
   * Đăng xuất
   */
  function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
  
  /**
   * Kiểm tra quyền truy cập trang admin
   */
  function checkAdminAccess() {
    const path = window.location.pathname;
    
    // Kiểm tra nếu đang ở trang admin
    if (path.includes('/admin/')) {
      if (!isAuthenticated) {
        // Chưa đăng nhập, chuyển hướng đến trang đăng nhập
        window.location.href = '../login.html';
        return;
      }
      
      const user = getUser();
      
      // Kiểm tra quyền truy cập
      if (user.role !== 'admin' && user.role !== 'editor') {
        // Không có quyền, chuyển hướng về trang chủ
        window.location.href = '../index.html';
        return;
      }
      
      // Kiểm tra quyền đối với trang quản lý người dùng (chỉ admin mới có quyền)
      if (path.includes('/admin/users.html') && user.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
      }
    }
  }
  
  // Cập nhật năm hiện tại trong footer
  const currentYearElements = document.querySelectorAll('#current-year');
  currentYearElements.forEach(element => {
    element.textContent = new Date().getFullYear();
  });
}); 