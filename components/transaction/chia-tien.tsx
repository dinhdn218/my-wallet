'use client'

import { formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { chiaHoaDon } from '@/store/useExpenseStore'

/**
 * Dải chia tiền — mở ngay trong form ghi nhanh, KHÔNG phải dialog.
 *
 * Ứng tiền cho cả nhóm là một thuộc tính của khoản đang gõ ("500k này chia 5
 * người"), không phải một luồng riêng. Đẩy nó vào modal sẽ dựng đúng cái lớp
 * chặn mà DESIGN.md § The Reach Rule cấm, và làm chậm việc ghi — trong khi
 * người dùng đang đứng ở quán vừa trả tiền xong.
 *
 * Số người là những ô sơn vuông bấm một chạm, không phải ô nhập số: đi ăn
 * nhóm gần như luôn là 2–6 người, và một chạm thì nhanh hơn gõ rồi tắt bàn
 * phím hệ thống. Nhóm đông hơn dùng ô cuối.
 */

/** 2–6 người phủ gần hết các bữa thật; 7+ nhường cho ô nhập tay. */
const SO_NGUOI_NHANH = [2, 3, 4, 5, 6]

const NGUOI_TOI_DA = 50

export function ChiaTien({
  soNguoi,
  onSoNguoiChange,
  onTat,
  amount,
  className,
}: {
  soNguoi: number
  onSoNguoiChange: (next: number) => void
  onTat: () => void
  /** Tổng hoá đơn đang gõ; null khi chưa gõ gì. */
  amount: number | null
  className?: string
}) {
  // Chưa gõ số thì vẫn hiện dải chọn người — thứ tự thao tác là của người
  // dùng, không phải của form. Chỉ phần xem trước là phải đợi có số.
  const phan = amount !== null ? chiaHoaDon(amount, soNguoi) : null
  const tuNhap = !SO_NGUOI_NHANH.includes(soNguoi)

  return (
    <div className={cn('bg-men-sau px-3.5 py-2.5', className)}>
      {/*
        Nhãn và dòng xem trước dùng CHUNG một hàng, không tách hai dòng: dải
        này nằm giữa bàn phím và nút GHI trên màn hình điện thoại cao 667px,
        và mỗi dòng thừa là một lần nút GHI trôi khỏi tầm ngón cái.
        Trước khi có số, hàng này là nhãn; có số rồi, nó thành kết quả chia.
      */}
      <div className="flex items-baseline justify-between gap-3">
        <span
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-[15px]"
        >
          {phan ? (
            <>
              <span className="text-muted">Bạn chịu </span>
              <span className="font-semibold tabular-nums">
                {formatVnd(phan.cuaMinh)}
              </span>
              <span className="text-muted"> · ứng {soNguoi - 1} người </span>
              <span className="font-semibold tabular-nums text-accent">
                {formatVnd(phan.ungRa)}
              </span>
            </>
          ) : (
            <span className="font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
              Chia cho mấy người
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onTat}
          className="shrink-0 py-0.5 text-[15px] font-medium text-muted underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Bỏ chia
        </button>
      </div>

      <div
        role="group"
        aria-label="Số người cùng chia, kể cả bạn"
        // Grid 6 cột chứ không phải flex-wrap: cột ghi chỉ rộng 360px, và ở
        // flex-wrap ô "7+" bị đẩy xuống một hàng riêng lẻ loi. Sáu ô bằng
        // nhau trên một hàng cũng đọc ra ngay là một thang chọn.
        className="mt-2 grid grid-cols-6 gap-1.5"
      >
        {SO_NGUOI_NHANH.map((n) => {
          const chon = soNguoi === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSoNguoiChange(n)}
              aria-pressed={chon}
              data-testid={`chia-${n}`}
              className={cn(
                'h-[44px] text-[17px] font-semibold tabular-nums',
                'transition-[filter] duration-[120ms] hover:brightness-110',
                // Chọn = tràn kín màu vàng nghệ, đúng cách thẻ giá đánh dấu
                // trạng thái chọn. Không viền, không dấu tích.
                chon
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-men-phim text-foreground',
              )}
            >
              {n}
            </button>
          )
        })}

        {/*
          Nhóm đông: ô nhập số thật, không phải nút. Hiếm dùng nên nó không
          được chiếm chỗ của năm ô một chạm phía trước.
        */}
        <input
          type="number"
          min={2}
          max={NGUOI_TOI_DA}
          inputMode="numeric"
          value={tuNhap ? soNguoi : ''}
          placeholder="7+"
          aria-label="Số người khác"
          data-testid="chia-khac"
          onChange={(e) => {
            const n = Number(e.target.value)
            // Chặn ở đây thay vì lúc lưu: một ô số cho gõ 0 rồi mới báo lỗi
            // là kiểu ô nhập bắt người dùng đoán luật.
            if (Number.isInteger(n) && n >= 2 && n <= NGUOI_TOI_DA) {
              onSoNguoiChange(n)
            }
          }}
          className={cn(
            'h-[44px] min-w-0 bg-men-phim px-1 text-center text-[17px] font-semibold tabular-nums',
            'outline-none placeholder:font-normal placeholder:text-muted',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
            // Ẩn mũi tên tăng/giảm của trình duyệt: ô chỉ rộng ~50px, mũi tên
            // chiếm mất chỗ con số và không ai bấm chúng trên điện thoại.
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            tuNhap && 'bg-accent text-accent-foreground placeholder:text-accent-foreground/60',
          )}
        />
      </div>
    </div>
  )
}
