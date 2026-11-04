/**
 * Tiện ích bảo mật: Chống XSS (Cross-Site Scripting) và ký tự đặc biệt nguy hiểm
 * Ngăn chặn việc nhập <script>alert(1)</script>, ký tự ' " ; vào các trường tên, địa chỉ, ghi chú.
 */

// Regex phát hiện thẻ script, handler javascript, html tags hoặc các ký tự nguy hiểm: ', ", ;, <, >
const DANGEROUS_PATTERNS = [
  /<\s*script\b[^>]*>/i,
  /<\/\s*script\s*>/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,
  /[<>'";]/,
];

/**
 * Kiểm tra xem chuỗi có chứa ký tự đặc biệt nguy hiểm hoặc mã độc XSS hay không.
 * Trả về true nếu phát hiện nguy hiểm.
 */
export function containsXssOrSpecialChars(text: string | null | undefined): boolean {
  if (!text) return false;
  const str = String(text);
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Kiểm tra tính an toàn của chuỗi văn bản.
 * Trả về true nếu chuỗi an toàn, false nếu vi phạm.
 */
export function isSafeInput(text: string | null | undefined): boolean {
  return !containsXssOrSpecialChars(text);
}

/**
 * Validate một trường dữ liệu (Họ tên, Địa chỉ, Ghi chú...).
 * Nếu không hợp lệ trả về thông báo lỗi trực quan; nếu hợp lệ trả về null.
 */
export function validateSafeText(fieldName: string, text: string | null | undefined): string | null {
  if (!text) return null;
  if (containsXssOrSpecialChars(text)) {
    return `${fieldName} không được chứa thẻ script (<script>) hoặc các ký tự đặc biệt nguy hiểm (<, >, ', ", ;)`;
  }
  return null;
}

/**
 * Làm sạch chuỗi đầu vào: loại bỏ script tags, html tags và các ký tự nguy hiểm
 */
export function sanitizeInput(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/<\s*script\b[^>]*>.*?<\/\s*script\s*>/gi, '')
    .replace(/[<>'";]/g, '')
    .trim();
}
