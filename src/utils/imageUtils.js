/**
 * 图片上传和处理工具
 */

/**
 * 将文件转换为 Base64
 * @param {File} file - 图片文件
 * @returns {Promise<string>} Base64 字符串
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * 压缩图片
 * @param {string} base64 - Base64 图片
 * @param {number} maxWidth - 最大宽度
 * @param {number} quality - 质量 (0-1)
 * @returns {Promise<string>} 压缩后的 Base64
 */
export function compressImage(base64, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // 按比例缩放
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    
    img.onerror = reject;
  });
}

/**
 * 验证图片文件
 * @param {File} file - 文件对象
 * @returns {Object} { valid, error }
 */
export function validateImageFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: '请选择文件' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG、PNG、WEBP 格式' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 10MB' };
  }
  
  return { valid: true };
}
