document.addEventListener('DOMContentLoaded', function() {
  // Cập nhật năm hiện tại trong footer
  const yearElements = document.querySelectorAll('#current-year');
  const currentYear = new Date().getFullYear();
  
  yearElements.forEach(element => {
    element.textContent = currentYear;
  });
  
  /**
   * Định dạng số thành tiền tệ Việt Nam
   * @param {number} value - Giá trị cần định dạng
   * @returns {string} Chuỗi đã định dạng
   */
  window.formatCurrency = function(value) {
    return new Intl.NumberFormat('vi-VN').format(value);
  };
  
  /**
   * Định dạng ngày tháng theo Việt Nam
   * @param {string|Date} date - Ngày cần định dạng
   * @returns {string} Chuỗi ngày đã định dạng
   */
  window.formatDate = function(date) {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
}); 