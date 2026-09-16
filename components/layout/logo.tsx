/**
 * Dấu hiệu nhận diện — ô vuông vàng nghệ với chữ V khoét thủng.
 *
 * Tiến hoá từ ô vuông đặc của bản trước chứ không thay thế nó: vẫn là vệt sơn
 * mẫu trên tấm bảng men, chỉ thêm một chữ cái được khoét ra như khuôn stencil —
 * đúng cách chữ trên bảng giá quán được sơn.
 *
 * Ba ràng buộc của thế giới này, đều được giữ:
 *   1. KHÔNG bo góc — `--radius: 0` áp cho mọi thứ, kể cả logo.
 *   2. Chỉ hai màu, và là đúng hai màu chữ ký: vàng nghệ trên men xanh.
 *   3. Đọc được ở 16px. Chữ V khoét thủng cho tương phản cao nhất có thể, nên
 *      nó vẫn ra hình ở cỡ favicon — khác với một hình cái ví vẽ nét, cỡ đó
 *      chỉ còn là vệt mờ.
 *
 * Dùng biến CSS chứ không hard-code màu: chế độ sáng đảo vàng nghệ thành nâu
 * và men thành be xanh, logo phải đi theo. Bản hard-code màu nằm ở app/icon.svg
 * vì file tĩnh không đọc được biến.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      // Chữ V là phần KHOÉT THỦNG: một path duy nhất, fill-rule evenodd cắt
      // hình thứ hai ra khỏi hình thứ nhất. Vẽ chữ V bằng path riêng màu nền
      // sẽ hở viền khi trình duyệt khử răng cưa hai hình chồng nhau.
      fill="var(--accent, #edc948)"
      fillRule="evenodd"
    >
      <path d="M0 0h32v32H0V0zm9 8h5l2 11 2-11h5l-4.5 16h-5L9 8z" />
    </svg>
  )
}
