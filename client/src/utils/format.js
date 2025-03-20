/**
 * Định dạng số thành chuỗi tiền tệ
 * @param {number} value - Giá trị cần định dạng
 * @returns {string} Chuỗi đã định dạng
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Định dạng ngày tháng
 * @param {string|Date} date - Ngày cần định dạng
 * @returns {string} Chuỗi ngày đã định dạng
 */
export const formatDate = (date) => {
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