'use client'

import { categoryOf } from '@/lib/categories'
import { formatDayLabel, formatTime, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/categories'
import type { Transaction } from '@/types/transaction'

/**
 * Một dòng trên bảng giá: tên món — đường chấm — giá.
 *
 * Đây là đơn vị hiển thị giao dịch DUY NHẤT của cả app (màn chính, màn Giao
 * dịch, màn Báo cáo), thay cho 3 biến thể hàng riêng của bản cũ. Đường chấm
 * nối tên với giá là chi tiết cốt lõi của thế giới bảng giá quán.
 */
export function DongGia({
  row,
  lookup,
  onClick,
  compact,
  className,
  ...props
}: {
  row: Transaction
  lookup?: (id: string) => Category
  onClick?: () => void
  /** Bỏ cột danh mục·giờ — dùng ở chỗ hẹp. */
  compact?: boolean
} & Omit<React.ComponentProps<'button'>, 'onClick'>) {
  const category = lookup ? lookup(row.categoryId) : categoryOf(row.categoryId)
  const thu = row.type === 'income'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group flex w-full items-baseline gap-3 py-2.5 text-left',
        onClick && 'transition-colors hover:bg-foreground/5',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 self-center"
        style={{ background: category.color }}
      />

      <span className="shrink-0 text-[16px] font-normal text-pretty">
        {row.note ?? category.label}
      </span>

      <span aria-hidden className="duong-cham mb-[3px] h-px flex-1 self-center" />

      {!compact && (
        <span className="hidden shrink-0 font-mono text-[11px] tracking-[.2em] text-muted uppercase sm:block">
          {category.label} · {formatTime(row.occurredAt)}
        </span>
      )}

      <span
        className={cn(
          'shrink-0 text-[19px] font-semibold tabular-nums',
          thu ? 'text-accent' : 'text-foreground',
        )}
      >
        {/* Bảng giá không viết số âm: khoản chi là GIÁ, khoản thu mới có dấu +. */}
        {thu ? formatVnd(row.amountVnd, { sign: true }) : formatVnd(row.amountVnd)}
      </span>
    </button>
  )
}

/** Gom các giao dịch liên tiếp cùng ngày thành nhóm có nhãn. */
export function groupByDay(rows: Transaction[]) {
  const groups: Array<{ label: string; rows: Transaction[] }> = []
  for (const row of rows) {
    const label = formatDayLabel(row.occurredAt)
    const last = groups.at(-1)
    if (last && last.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  }
  return groups
}

/** Nhãn ngày — mono, in hoa, sàn 11px. */
export function NhanNgay({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 mb-1 font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase first:mt-0">
      {children}
    </h3>
  )
}
