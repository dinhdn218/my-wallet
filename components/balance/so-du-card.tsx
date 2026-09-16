'use client'

import { useState } from 'react'
import { AmountSkeleton, CardLabel } from '@/components/ui/glass-card'
import { formatVnd, parseAmountVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  computeDrift,
  useExpenseStore,
  useMonthlySummary,
  useSoDu,
} from '@/store/useExpenseStore'

/**
 * Số dư thật — khối duy nhất trong app hiện con số "tiền đang có".
 *
 * Chỉ sống ở màn Báo cáo. Màn chính giữ "Còn tiêu được": số dư không phải câu
 * hỏi cần trả lời trong 2 giây lúc đang đứng ở quán, và hai con số tiền cạnh
 * nhau là mời người ta đọc nhầm.
 *
 * ⚠️ Chưa có mốc nào thì KHÔNG hiện số nào cả — mời đặt mốc. Xem
 * docs/superpowers/specs/2026-09-17-so-du-design.md để biết vì sao
 * `Σthu − Σchi` không được phép hiện như một số dư.
 */
export function SoDuCard({ className }: { className?: string }) {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const transactions = useExpenseStore((s) => s.transactions)
  const balanceMarks = useExpenseStore((s) => s.balanceMarks)
  const setBalanceMark = useExpenseStore((s) => s.setBalanceMark)
  const { balance, at, laThangNay } = useSoDu()
  const { net } = useMonthlySummary()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const nhap = parseAmountVnd(draft)
  // Chênh lệch tính ngay khi đang gõ, để người dùng thấy trước khi xác nhận.
  const drift =
    nhap === null ? null : computeDrift(transactions, balanceMarks, at, nhap)

  async function luu() {
    if (nhap === null || busy) return
    setBusy(true)
    setFailed(false)
    try {
      await setBalanceMark(at, nhap)
    } catch {
      // Giữ nguyên ô đang gõ khi lưu hỏng — không xoá công của người dùng.
      setFailed(true)
      setBusy(false)
      return
    }
    setBusy(false)
    setEditing(false)
    setDraft('')
  }

  function huy() {
    setEditing(false)
    setDraft('')
    setFailed(false)
  }

  const nhanSo = laThangNay ? 'Số dư hiện tại' : 'Số dư cuối tháng'

  return (
    <section className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3">
        <CardLabel>{nhanSo}</CardLabel>
        {hasHydrated && balance && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[11px] font-medium tracking-[.2em] text-accent uppercase underline underline-offset-4"
          >
            Đối soát
          </button>
        )}
      </div>

      {!hasHydrated ? (
        <AmountSkeleton className="mt-3 h-[44px] w-[60%]" />
      ) : balance ? (
        <>
          <p
            data-testid="so-du"
            className={cn(
              'mt-3 flex items-baseline gap-1.5 text-[34px] leading-none font-semibold tracking-[-.03em] tabular-nums',
              balance.amount < 0 && 'text-negative',
            )}
          >
            {formatVnd(balance.amount, { unit: false })}
            <span className="text-[.38em] font-normal text-muted">đ</span>
          </p>

          {/* Mốc càng cũ thì con số càng đáng nghi — nói ra ngày gốc là cách
              duy nhất để người dùng tự đánh giá độ tin cậy của nó. */}
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
            Tính từ mốc {ngayNgan(balance.mark.asOf)} ·{' '}
            {net === 0 ? (
              'tháng này hoà'
            ) : (
              <>
                tháng này {net > 0 ? 'dư' : 'thiếu'}{' '}
                <b
                  className={cn(
                    'font-bold',
                    net > 0 ? 'text-foreground' : 'text-negative',
                  )}
                >
                  {formatVnd(Math.abs(net))}
                </b>
              </>
            )}
          </p>
        </>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-[15px] text-pretty text-muted">
            Chưa biết bạn đang có bao nhiêu. Nhập số tiền thật sự đang có —
            gộp cả ví, ngân hàng, tiền mặt — rồi app tự cộng trừ từ đó.
          </p>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-[44px] w-fit shrink-0 bg-accent px-4 text-[15px] font-semibold text-accent-foreground"
            >
              Đặt số dư
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nhap !== null) void luu()
                if (e.key === 'Escape') huy()
              }}
              placeholder="VD: 12tr"
              aria-label="Số tiền thật sự đang có"
              className="h-[44px] min-w-0 flex-1 bg-men-sau px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            />
            <button
              type="button"
              onClick={luu}
              disabled={nhap === null || busy}
              className={cn(
                'h-[44px] shrink-0 bg-accent px-4 text-[15px] font-semibold text-accent-foreground',
                (nhap === null || busy) && 'opacity-40',
              )}
            >
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={huy}
              className="h-[44px] shrink-0 bg-men-phim px-3 text-[15px] font-medium text-muted"
            >
              Huỷ
            </button>
          </div>

          {/*
            Phần đáng giá nhất của cả tính năng: nói thẳng sổ lệch bao nhiêu so
            với đời thực. Không có bước này thì mốc chỉ dời điểm xuất phát, còn
            sai số vẫn trôi y như cũ mà không ai biết.
          */}
          {drift !== null && drift !== 0 && (
            <p className="text-[15px] leading-snug text-pretty">
              Theo sổ là{' '}
              <b className="font-semibold">{formatVnd(nhap! - drift)}</b>. Lệch{' '}
              <b className="font-semibold text-negative">
                {formatVnd(Math.abs(drift))}
              </b>{' '}
              — có vẻ bạn đã quên ghi {drift < 0 ? 'một khoản chi' : 'một khoản thu'}.
            </p>
          )}
          {drift === 0 && (
            <p className="text-[15px] text-muted">Khớp với sổ. Bạn ghi đủ.</p>
          )}

          {failed && (
            <p className="border-2 border-negative bg-negative/12 p-2.5 text-[15px]">
              Lưu không được. Kiểm tra kết nối rồi thử lại.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

/** "2026-09-01T..." -> "01/09". Ngày theo giờ địa phương, cùng quy ước monthKey. */
function ngayNgan(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
