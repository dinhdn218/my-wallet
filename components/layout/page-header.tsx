'use client'

import { MonthPicker } from '@/components/layout/month-picker'
import { cn } from '@/lib/utils'

/**
 * Đầu trang dùng chung cho 4 màn phụ.
 *
 * Không còn nút "+ Thêm giao dịch": việc ghi đã có chỗ cố định ở màn chính và
 * thanh tab dưới (mobile), nên nhân bản nó lên mọi đầu trang chỉ làm loãng.
 */
export function PageHeader({
  title,
  meta,
  showMonthPill = true,
  children,
}: {
  title: string
  meta?: React.ReactNode
  showMonthPill?: boolean
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-[26px] leading-none font-semibold tracking-[-.01em] md:text-[27px]">
          {title}
        </h1>
        {meta ? (
          <p className="font-mono text-[11px] tracking-[.06em] text-muted">
            {meta}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {children}
        {showMonthPill && <MonthPicker className="hidden sm:flex" />}
      </div>
    </header>
  )
}

/** Chip lọc — thẻ giá nhỏ, vuông góc như mọi thứ trong thế giới này. */
export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-9 shrink-0 items-center gap-2 px-3.5 text-[15px] transition-colors duration-[120ms]',
        active
          ? 'bg-accent font-semibold text-accent-foreground'
          : 'bg-men-dam font-normal text-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}
