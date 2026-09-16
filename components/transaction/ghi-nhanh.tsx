'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { BanPhimSo } from '@/components/transaction/ban-phim-so'
import { DaiTheGia } from '@/components/transaction/dai-the-gia'
import { SaveError } from '@/components/transaction/save-error'
import { EXPENSE_CATEGORY_IDS, INCOME_CATEGORY_IDS } from '@/lib/categories'
import { formatVnd, parseAmountVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useCategoryLookup,
  useCategoryUsage,
  useExpenseStore,
} from '@/store/useExpenseStore'
import type { TxType } from '@/types/transaction'

/**
 * Khối ghi nhanh — trái tim của bản thiết kế này.
 *
 * Luôn hiện sẵn ở màn chính, không nằm sau sheet hay dialog: mở app là gõ được
 * ngay. Chỉ có hai thứ bắt buộc — SỐ TIỀN và DANH MỤC. Ngày mặc định là hôm
 * nay, ghi chú là tuỳ chọn và chỉ hiện khi người dùng chủ động mở.
 *
 * Nguồn tiền đã gỡ bỏ, nên form này ngắn hơn bản cũ đúng một ô bắt buộc.
 */
export function GhiNhanh({
  onPendingChange,
  className,
}: {
  /** Báo số đang gõ dở ra ngoài để con số lớn tụt xuống theo từng phím. */
  onPendingChange?: (amount: number) => void
  className?: string
}) {
  const addTransaction = useExpenseStore((s) => s.addTransaction)
  const lookup = useCategoryLookup()
  const usage = useCategoryUsage()
  const reduceMotion = useReducedMotion()

  const [type, setType] = useState<TxType>('expense')
  const [raw, setRaw] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [note, setNote] = useState('')
  const [moGhiChu, setMoGhiChu] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  const amount = parseAmountVnd(raw)

  // Đẩy số đang gõ lên cha. Dùng effect vì cha render con số ở nhánh khác.
  useEffect(() => {
    onPendingChange?.(type === 'expense' ? (amount ?? 0) : 0)
  }, [amount, type, onPendingChange])
  const ids = type === 'income' ? INCOME_CATEGORY_IDS : EXPENSE_CATEGORY_IDS
  const sanSang = amount !== null && amount > 0 && categoryId !== ''
  const dangLuu = status === 'saving'
  const mauDanhMuc = categoryId ? lookup(categoryId).color : undefined
  const oNhap = useRef<HTMLInputElement>(null)

  function doiLoai(next: TxType) {
    setType(next)
    // Danh mục tách theo loại, nên bỏ lựa chọn cũ.
    setCategoryId('')
  }

  /**
   * Chỉ nhận ký tự có nghĩa cho số tiền: chữ số, dấu thập phân, và hậu tố
   * k/tr. Lọc ngay lúc gõ thay vì báo lỗi sau — parseAmountVnd vốn trả null
   * êm khi chuỗi dở dang, nên không bao giờ hiện lỗi đỏ giữa chừng.
   */
  function onChangeRaw(next: string) {
    const sach = next
      .toLowerCase()
      .replace(/[^0-9.,ktr]/g, '')
      // Hậu tố chỉ được xuất hiện một lần, ở cuối.
      .replace(/(tr|k)(?=.*(tr|k))/g, '')
    setRaw(sach)
  }

  function onKeyDownRaw(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter = Ghi, đúng như bấm nút — người gõ bàn phím không phải với chuột.
    if (e.key === 'Enter') {
      e.preventDefault()
      void luu()
      return
    }
    // Escape xoá nhanh số đang gõ dở.
    if (e.key === 'Escape') {
      e.preventDefault()
      setRaw('')
    }
  }

  async function luu() {
    if (!sanSang || dangLuu) return
    setStatus('saving')
    try {
      await addTransaction({
        type,
        amountVnd: amount,
        categoryId,
        note: note.trim() || undefined,
        occurredAt: new Date().toISOString(),
      })
    } catch {
      // Giữ nguyên thứ đã gõ khi lưu hỏng — không xoá công của người dùng.
      setStatus('error')
      return
    }
    setStatus('idle')
    setRaw('')
    setNote('')
    setMoGhiChu(false)
    // Giữ nguyên danh mục: ghi nhiều khoản cùng loại liên tiếp là chuyện thường.
  }

  return (
    <section className={cn('flex flex-col', className)} aria-label="Ghi giao dịch">
      {/* Thẻ giá danh mục treo dây kẽm */}
      <DaiTheGia
        ids={ids}
        lookup={lookup}
        usage={usage}
        selected={categoryId}
        onSelect={setCategoryId}
      />

      {/*
        Ô hiển thị số đang gõ. Màu danh mục đang chọn tràn vào đây — vạch dày
        bên trái + con trỏ — nên không thể nhìn con số mà không biết nó thuộc
        danh mục nào.
      */}
      <div
        className="mt-4 flex items-stretch bg-men-sau transition-colors duration-200"
        style={
          categoryId
            ? {
                // Màu danh mục TRÀN vào cả vùng số, không chỉ đánh dấu mép:
                // nền ô ngả sang màu đó, và con số mang chính màu đó.
                backgroundColor: `color-mix(in oklab, ${mauDanhMuc} 22%, var(--men-sau))`,
              }
            : undefined
        }
      >
        <span
          aria-hidden
          className="w-2 shrink-0 transition-colors duration-200"
          style={{ background: categoryId ? mauDanhMuc : 'transparent' }}
        />
        <span className="self-center pl-3 font-mono text-[11px] tracking-[.2em] text-muted uppercase">
          {type === 'income' ? 'Thu' : 'Chi'}
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 py-[clamp(6px,1.2vh,10px)] pr-4">
          {/*
            Con số KHÔNG tô màu danh mục: 6 màu biểu đồ do người dùng chọn, có
            màu sáng (teal, vàng) tụt xuống ~1:1 trên nền men sáng. Màu danh mục
            chỉ đi vào khối đặc và con trỏ — chỗ không mang chữ — nên vẫn "tràn"
            rõ mà không bao giờ hy sinh độ đọc.
          */}
          {/*
            Ô nhập THẬT, không phải span hiển thị: gõ được bằng bàn phím máy
            tính, dán được, dùng được mũi tên và Backspace. Bàn phím số trên
            màn hình ghi vào đúng state này, nên hai lối nhập không bao giờ
            lệch nhau.

            inputMode="decimal" để điện thoại bật bàn phím số của hệ thống khi
            người dùng chạm thẳng vào ô — còn bàn phím riêng bên dưới vẫn là
            lối chính, nhanh hơn vì có k/tr.
          */}
          <input
            ref={oNhap}
            type="text"
            value={raw}
            onChange={(e) => onChangeRaw(e.target.value)}
            onKeyDown={onKeyDownRaw}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="0"
            aria-label="Số tiền"
            data-testid="o-nhap-so"
            className={cn(
              'w-full min-w-0 bg-transparent text-right text-[clamp(30px,4.2vh,38px)] leading-none',
              'font-semibold tabular-nums caret-accent outline-none',
              'placeholder:text-muted',
            )}
            style={mauDanhMuc ? { caretColor: mauDanhMuc } : undefined}
          />
        </div>
      </div>

      {/* Số đã hiểu — xác nhận theo từng phím, không báo lỗi đỏ khi gõ dở */}
      <p
        aria-live="polite"
        className="mt-1 min-h-[16px] shrink-0 text-right font-mono text-[11px] text-muted"
      >
        {amount !== null ? `= ${formatVnd(amount)}` : ''}
      </p>

      <BanPhimSo value={raw} onChange={onChangeRaw} focusRef={oNhap} className="mt-2">
        <button
          type="button"
          onClick={() => doiLoai(type === 'expense' ? 'income' : 'expense')}
          aria-pressed={type === 'income'}
          className={cn(
            'flex h-[clamp(44px,6.2vh,58px)] items-center justify-center text-[15px] font-semibold',
            'transition-[filter] duration-[120ms] hover:brightness-110',
            type === 'income'
              ? 'bg-accent text-accent-foreground'
              : 'bg-men-phim text-accent',
          )}
        >
          THU
        </button>
      </BanPhimSo>

      {/* Ghi chú — ẩn mặc định, mở khi cần. Không chiếm chỗ của việc ghi nhanh. */}
      {moGhiChu ? (
        <input
          autoFocus
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Ghi chú — ví dụ: đi chợ cuối tuần"
          aria-label="Ghi chú"
          className="mt-2 h-[46px] w-full bg-men-sau px-3.5 text-[15px] outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        />
      ) : (
        <button
          type="button"
          onClick={() => setMoGhiChu(true)}
          className="mt-[clamp(4px,1vh,10px)] shrink-0 self-start py-0.5 text-[15px] font-medium text-muted underline underline-offset-4 transition-colors hover:text-foreground"
        >
          + Thêm ghi chú
        </button>
      )}

      {status === 'error' && <SaveError onRetry={luu} />}

      <motion.button
        type="button"
        whileTap={reduceMotion || !sanSang ? undefined : { scale: 0.99 }}
        onClick={luu}
        disabled={!sanSang || dangLuu}
        data-testid="nut-ghi"
        className={cn(
          'mt-auto flex h-[clamp(48px,6.6vh,58px)] shrink-0 items-center justify-center gap-2 px-4',
          'text-[16px] font-semibold tracking-[.04em] uppercase',
          'transition-[filter,background-color] duration-[120ms]',
          sanSang
            ? 'bg-negative text-negative-foreground hover:brightness-110 active:brightness-95'
            : 'bg-men-phim text-muted',
        )}
      >
        {dangLuu
          ? 'Đang ghi…'
          : sanSang
            ? `Ghi ${formatVnd(amount)} · ${lookup(categoryId).label}`
            : amount === null || amount === 0
              ? 'Gõ số tiền'
              : 'Chọn danh mục'}
      </motion.button>
    </section>
  )
}
