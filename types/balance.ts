/**
 * Mốc số dư — số tiền người dùng THẬT SỰ có tại một thời điểm.
 *
 * Số dư không được lưu, nó được SUY RA:
 *   số dư tại T = mốc gần nhất trước T + Σthu − Σchi (giao dịch sau mốc, tới T)
 *
 * Một khái niệm này phục vụ cả hai việc: mốc đầu tiên là "số dư đầu kỳ", mốc
 * thêm về sau là "đối soát" — và mỗi lần đối soát, sai số tích luỹ do quên ghi
 * bị cắt về 0. Xem docs/superpowers/specs/2026-09-17-so-du-design.md.
 *
 * Không phân biệt ví / ngân hàng: một con số cho tất cả. Nhờ vậy chuyển tiền
 * giữa các tài khoản của chính mình là vô hình với app.
 */
export interface BalanceMark {
  /** ISO, luôn kết thúc bằng 'Z' (xem mappers.ts). */
  asOf: string
  /**
   * ÂM ĐƯỢC — khác `Transaction.amountVnd` luôn dương. Bất biến "số tiền luôn
   * dương" nói về giao dịch; số dư thì âm thật khi đang nợ.
   */
  amountVnd: number
}
