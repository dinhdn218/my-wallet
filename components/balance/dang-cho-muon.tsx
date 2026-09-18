'use client'

import { CardLabel } from '@/components/ui/glass-card'
import { formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDangChoMuon, useExpenseStore } from '@/store/useExpenseStore'

/**
 * Tiền đã ứng cho người khác mà chưa đòi về — CỘNG DỒN MỌI THÁNG.
 *
 * Đứng cạnh số dư vì hai con số phải đọc cùng nhau: số dư nói "trong ví còn
 * bấy nhiêu", khối này nói "bấy nhiêu nữa đang ở túi người khác". Thiếu nó,
 * người dùng thấy ví hụt mà không biết vì sao.
 *
 * ⚠️ KHÔNG lọc theo `activeMonth`, cố ý ngược với mọi khối khác trong app.
 * Khoản ứng tháng 8 chưa đòi vẫn là tiền đang thiếu trong tháng 9; lọc theo
 * tháng sẽ khiến nó biến mất đúng lúc cần nhớ nhất.
 *
 * Chưa từng ứng lần nào thì KHÔNG hiện gì. Đây không phải tính năng ai cũng
 * dùng, và một dòng "Đang cho mượn 0đ" vĩnh viễn là rác trên màn hình.
 */
export function DangChoMuon({ className }: { className?: string }) {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const { conLai, daUng, daDoi } = useDangChoMuon()

  if (!hasHydrated || daUng === 0) return null

  // Đòi về nhiều hơn đã ứng: sổ đang lệch, gần như chắc chắn do quên ghi lúc
  // ứng. Nói thẳng thay vì kẹp về 0 — giấu đi thì không ai biết mà sửa.
  const lech = conLai < 0
  const xong = conLai === 0

  return (
    <section className={cn('flex flex-col', className)} data-testid="dang-cho-muon">
      <CardLabel>{xong ? 'Đã đòi xong' : 'Đang cho mượn'}</CardLabel>

      <p
        data-testid="so-dang-cho-muon"
        className={cn(
          'mt-3 flex items-baseline gap-1.5 text-[34px] leading-none font-semibold tracking-[-.03em] tabular-nums',
          lech && 'text-negative',
        )}
      >
        {formatVnd(Math.abs(conLai), { unit: false })}
        <span className="text-[.38em] font-normal text-muted">đ</span>
      </p>

      <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
        {lech ? (
          <>
            Đòi về nhiều hơn đã ứng — có vẻ một lần ứng chưa được ghi. Đã ứng{' '}
            {formatVnd(daUng)}, đã nhận {formatVnd(daDoi)}.
          </>
        ) : xong ? (
          <>Đã ứng {formatVnd(daUng)} và nhận lại đủ.</>
        ) : (
          <>
            Đã ứng {formatVnd(daUng)} · đã đòi được {formatVnd(daDoi)}. Nhận lại
            thì ghi một khoản Thu vào &ldquo;Ứng cho nhóm&rdquo;.
          </>
        )}
      </p>
    </section>
  )
}
