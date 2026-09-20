import type { MetadataRoute } from 'next'

/**
 * Web app manifest — thứ quyết định app trông thế nào khi được CÀI lên máy.
 *
 * Thiếu file này thì Android không coi đây là app cài được: "Thêm vào màn hình
 * chính" chỉ tạo một lối tắt, icon là favicon bị dán thêm huy hiệu trình duyệt
 * ở góc, và mở ra vẫn còn nguyên thanh địa chỉ.
 *
 * Icon ở đây là bản PNG kết xuất từ app/icon.svg — chạy `node scripts/tao-icon.mjs`
 * sau mỗi lần sửa logo. Manifest KHÔNG trỏ thẳng vào icon.svg vì Android cần
 * kích thước cụ thể để chọn bản phù hợp với mật độ màn hình.
 *
 * iOS thì không đọc file này cho icon — nó đọc app/apple-icon.png.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ví Của Tôi — Quản lý chi tiêu',
    // Tên dưới icon trên màn hình chính: chỉ vừa khoảng 12 ký tự trước khi bị
    // cắt bằng dấu ba chấm, nên bỏ phần mô tả.
    short_name: 'Ví Của Tôi',
    description: 'Thu chi cá nhân, VND.',
    lang: 'vi',
    start_url: '/',
    // standalone: mở từ màn hình chính là không còn thanh địa chỉ — đúng tinh
    // thần "mở app là gõ được ngay" của PRODUCT.md.
    display: 'standalone',
    /*
      Cả hai màu đều là men xanh, KHÔNG phải màu nền của chế độ sáng: manifest
      chỉ nhận đúng một giá trị, không theo được prefers-color-scheme. Chọn men
      tối vì nó trùng nền của chính icon, nên màn splash không loé một khung
      màu khác trước khi app hiện ra.

      Thẻ <meta name="theme-color"> theo chế độ sáng/tối vẫn còn ở
      app/layout.tsx và trình duyệt ưu tiên nó cho thanh trạng thái.
    */
    background_color: '#0f4c3a',
    theme_color: '#0f4c3a',
    icons: [
      { src: '/brand/logo-vuong-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/logo-vuong-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
